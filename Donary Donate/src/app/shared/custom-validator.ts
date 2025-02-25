export class CustomValidator {
  validateGreaterThanZero(control: any) {
    const value = control.value;
    if (value && isNaN(value)) {
      return { notANumber: true };
    }
    if (value <= 0) {
      return { notGreaterThanZero: true };
    }
    return null;
  }
}
