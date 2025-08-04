export const getTransactionId = () => {
  return `TRK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

// TRK-YYYYMMDD-xxxxxx
