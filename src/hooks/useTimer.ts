import { useState, useEffect } from 'react';

export function useTimer(isActive: boolean, activeStart: number | null) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isActive || !activeStart) {
      setElapsed(0);
      return;
    }

    setElapsed((Date.now() - activeStart) / 1000);

    const interval = setInterval(() => {
      setElapsed((Date.now() - activeStart) / 1000);
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, activeStart]);

  return elapsed;
}

export function useTimeSinceLast(isActive: boolean, lastEndTime: number | null) {
  const [since, setSince] = useState(0);

  useEffect(() => {
    if (isActive || !lastEndTime) {
      setSince(0);
      return;
    }

    const update = () => setSince((Date.now() - lastEndTime) / 1000);
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isActive, lastEndTime]);

  return since;
}
