export class ExampleNameRequiredError extends Error {
  constructor() {
    super('Example name is required');
    this.name = 'ExampleNameRequiredError';
  }
}

export class ExampleNameTooLongError extends Error {
  constructor() {
    super('Example name must be 120 characters or fewer');
    this.name = 'ExampleNameTooLongError';
  }
}
