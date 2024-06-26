class ValueTracker {
  private values: { timestamp: number, value: number }[] = [];
  private windowSize: number = 30000;

  constructor(windowSize = 30000) {
    this.windowSize = windowSize;
    setInterval(this.clearValues.bind(this), 250);
  }

  addValue(value: number): void {
    const timestamp = Date.now();
    this.values.push({ timestamp, value });
  }

  getLowestValue(): number {
    if (this.values.length === 0) {
      return 0;
    }

    const min = Math.min(...this.values.map(item => item.value));
    return min;
  }

  getHighestValue(): number {
    if (this.values.length === 0) {
      return 0;
    }

    const max = Math.max(...this.values.map(item => item.value));
    return max;
  }

  clearValues() {
    const now = Date.now();
    this.values = this.values.filter(item => (now - item.timestamp) <= this.windowSize);
  }

  average(): number {
    if (this.values.length === 0) {
      return 0;
    }

    const sum = this.values.reduce((acc, item) => acc + item.value, 0);
    return sum / this.values.length;
  }
}

export default ValueTracker;