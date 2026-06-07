import { describe, expect, it } from 'vitest';
import {
  Encoder,
  Profile,
  type FileIdMesg,
  type LapMesg,
  type SessionMesg,
  type SplitMesg,
} from '@garmin/fitsdk';
import { importSessionFormFromGarminFit } from '../../src/tracker/import-garmin-fit.js';
import { createEmptySessionForm } from '../../src/tracker/session-form-state.js';

const FILE_ID_MESG_NUM = Profile.MesgNum.FILE_ID ?? 0;
const SESSION_MESG_NUM = Profile.MesgNum.SESSION ?? 18;
const SPLIT_MESG_NUM = Profile.MesgNum.SPLIT ?? 312;
const LAP_MESG_NUM = Profile.MesgNum.LAP ?? 19;

const createFitFile = (
  build: (encoder: Encoder) => void,
  fileName = 'activity.fit',
): File => {
  const encoder = new Encoder();

  const fileIdMesg: FileIdMesg = {
    type: 'activity',
    manufacturer: 'garmin',
    product: 1,
    timeCreated: new Date('2026-05-20T10:30:00.000Z'),
  };

  encoder.onMesg(FILE_ID_MESG_NUM, fileIdMesg);

  build(encoder);

  const bytes = encoder.close();

  return new File([Uint8Array.from(bytes)], fileName, {
    type: 'application/octet-stream',
  });
};

describe('Garmin FIT import', () => {
  it('imports climb and rest splits from a Garmin FIT file', async () => {
    const file = createFitFile((encoder) => {
      const sessionMesg: SessionMesg = {
        sport: 'rockClimbing',
        subSport: 'bouldering',
        startTime: new Date('2026-05-20T10:00:00.000Z'),
        timestamp: new Date('2026-05-20T10:30:00.000Z'),
        totalElapsedTime: 1800,
        totalTimerTime: 1500,
      };
      const firstSplitMesg: SplitMesg = {
        splitType: 'climbActive',
        startTime: new Date('2026-05-20T10:00:00.000Z'),
        endTime: new Date('2026-05-20T10:01:00.000Z'),
        totalElapsedTime: 60,
        totalTimerTime: 55,
      };
      const secondSplitMesg: SplitMesg = {
        splitType: 'climbRest',
        startTime: new Date('2026-05-20T10:01:00.000Z'),
        endTime: new Date('2026-05-20T10:03:00.000Z'),
        totalElapsedTime: 120,
        totalTimerTime: 120,
      };
      const thirdSplitMesg: SplitMesg = {
        splitType: 'climbActive',
        startTime: new Date('2026-05-20T10:03:00.000Z'),
        endTime: new Date('2026-05-20T10:04:30.000Z'),
        totalElapsedTime: 90,
        totalTimerTime: 80,
      };

      encoder.onMesg(SESSION_MESG_NUM, sessionMesg);
      encoder.onMesg(SPLIT_MESG_NUM, firstSplitMesg);
      encoder.onMesg(SPLIT_MESG_NUM, secondSplitMesg);
      encoder.onMesg(SPLIT_MESG_NUM, thirdSplitMesg);
    });

    const imported = await importSessionFormFromGarminFit(file, {
      ...createEmptySessionForm(),
      gymId: 'a1b2c3d4-e5f6-4789-a234-56789abcdef0',
      location: 'Main Wall',
      notes: 'Imported from watch',
    });

    expect(imported).toMatchObject({
      gymId: 'a1b2c3d4-e5f6-4789-a234-56789abcdef0',
      location: 'Main Wall',
      notes: 'Imported from watch',
      status: 'stopped',
      startTime: '2026-05-20T10:00:00.000Z',
      endTime: '2026-05-20T10:30:00.000Z',
      totalDurationMs: 1_800_000,
    });
    expect(imported.entries).toHaveLength(3);
    expect(imported.entries[0]).toMatchObject({
      type: 'climb',
      sequenceOrder: 0,
      durationMs: 55_000,
      climbAttempts: [expect.objectContaining({ durationMs: 55_000 })],
    });
    expect(imported.entries[1]).toMatchObject({
      type: 'break',
      sequenceOrder: 1,
      durationMs: 120_000,
    });
    expect(imported.entries[2]).toMatchObject({
      type: 'climb',
      sequenceOrder: 2,
      durationMs: 80_000,
      climbAttempts: [expect.objectContaining({ durationMs: 80_000 })],
    });
  });

  it('falls back to lap timings and inferred breaks when split messages are absent', async () => {
    const file = createFitFile((encoder) => {
      const sessionMesg: SessionMesg = {
        sport: 'rockClimbing',
        startTime: new Date('2026-05-20T10:00:00.000Z'),
        timestamp: new Date('2026-05-20T10:08:00.000Z'),
        totalElapsedTime: 480,
      };
      const firstLapMesg: LapMesg = {
        startTime: new Date('2026-05-20T10:00:00.000Z'),
        timestamp: new Date('2026-05-20T10:01:00.000Z'),
        totalElapsedTime: 60,
        totalTimerTime: 60,
      };
      const secondLapMesg: LapMesg = {
        startTime: new Date('2026-05-20T10:03:00.000Z'),
        timestamp: new Date('2026-05-20T10:04:30.000Z'),
        totalElapsedTime: 90,
        totalTimerTime: 90,
      };

      encoder.onMesg(SESSION_MESG_NUM, sessionMesg);
      encoder.onMesg(LAP_MESG_NUM, firstLapMesg);
      encoder.onMesg(LAP_MESG_NUM, secondLapMesg);
    });

    const imported = await importSessionFormFromGarminFit(
      file,
      createEmptySessionForm(),
    );

    expect(imported.entries).toHaveLength(3);
    expect(imported.entries.map((entry) => entry.type)).toEqual([
      'climb',
      'break',
      'climb',
    ]);
    expect(imported.entries[1]).toMatchObject({
      durationMs: 120_000,
      sequenceOrder: 1,
    });
  });

  it('rejects files that are not valid FIT activities', async () => {
    const file = new File([new Uint8Array([1, 2, 3, 4])], 'bad.fit', {
      type: 'application/octet-stream',
    });

    await expect(
      importSessionFormFromGarminFit(file, createEmptySessionForm()),
    ).rejects.toThrow('Select a valid Garmin .fit file');
  });
});
