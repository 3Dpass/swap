import React from "react";

const TestComponent = () => {
  const brokenType: string = 123; // TypeScript error

  return <div>Test {brokenType}</div>;
};

export default TestComponent;
