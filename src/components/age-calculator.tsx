"use client";

import { useState, useEffect } from 'react';

const AgeCalculator = ({ birthDate }: { birthDate: string }) => {
  const [age, setAge] = useState<number | null>(null);

  useEffect(() => {
    const calculateAge = () => {
      const today = new Date();
      const birthDateObj = new Date(birthDate);
      let calculatedAge = today.getFullYear() - birthDateObj.getFullYear();
      const monthDifference = today.getMonth() - birthDateObj.getMonth();
      if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDateObj.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge);
    };

    calculateAge();
  }, [birthDate]);

  if (age === null) {
    return <span className="h-10 w-10 animate-pulse bg-muted-foreground/20 rounded-md" />;
  }

  return <>{age}</>;
};

export default AgeCalculator;
