export interface SMNote {
  time: number; // in seconds
  beat: number;
  col: number;  // 0 to 3
  type: 'tap' | 'mine';
}

export function parseSMNotes(smContent: string, bpm: number, offset: number): SMNote[] {
  const notes: SMNote[] = [];
  
  // Find the NOTES section by splitting
  const notesSplit = smContent.split('#NOTES:');
  if (notesSplit.length < 2) return notes;
  
  const parts = notesSplit[1].split(':');
  // 0: \n     dance-single
  // 1: \n     
  // 2: \n     Beginner
  // 3: \n     1
  // 4: \n     0.733...
  // 5: \n0000\n1000...
  if (parts.length < 6) return notes;
  
  const noteData = parts[5].split(';')[0];
  const measuresData = noteData.split(',\n');
  
  let currentBeat = 0;
  
  for (let m = 0; m < measuresData.length; m++) {
    const lines = measuresData[m].trim().split('\n').filter(line => line.length > 0 && !line.startsWith('//'));
    
    // In our generator, it's 4 lines per measure (quarter notes)
    const linesPerMeasure = lines.length;
    const beatIncrement = 4 / linesPerMeasure; // Usually 4/4 = 1 beat per line
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const timeInSeconds = offset + currentBeat * (60 / bpm);
      
      for (let col = 0; col < Math.min(line.length, 4); col++) {
        const char = line[col];
        if (char === '1') {
          notes.push({ time: timeInSeconds, beat: currentBeat, col, type: 'tap' });
        } else if (char === 'M') {
          notes.push({ time: timeInSeconds, beat: currentBeat, col, type: 'mine' });
        }
      }
      
      currentBeat += beatIncrement;
    }
  }
  
  return notes;
}
