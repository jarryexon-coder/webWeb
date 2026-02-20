import React, { useState, useEffect } from 'react';

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
}

const AllStarCountdown: React.FC = () => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 4,
    hours: 0,
    minutes: 0
  });

  useEffect(() => {
    const allStarDate = new Date('2026-02-15T20:00:00');
    
    const calculateTime = (): void => {
      const now = new Date();
      const diff = allStarDate.getTime() - now.getTime();
      
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        setTimeRemaining({ days, hours, minutes });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg">
      <div className="flex items-center space-x-3">
        <span className="text-xl">🏀</span>
        <div>
          <p className="text-xs uppercase tracking-wider text-purple-200">All-Star 2026</p>
          <p className="font-bold">
            {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
          </p>
        </div>
      </div>
    </div>
  );
};

export default AllStarCountdown;
