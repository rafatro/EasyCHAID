// JavaScript Document
// Chisquared distribution
// Require Gamma functions

function pchisq(x2, nu) {
  if (x2 === 0) return 0;
  if (!x2) {
    console.log("Error: x is required for Chi-squared distribution.");
    return;
  }
  if (!nu) {
    console.log("Error: number of degrees of freedom is required for Chi-squared distribution.");
    return;
  }
  if (x2 < 0) {
    console.log("Error: Bad x in Chi-squared distribution. x must be positive.");
    return;
  }
  if (nu <= 0) {
    console.log("Error: Bad number of degrees of freedom in Chi-squared distribution. It must be greater than 0.");
    return;
  }
  return gammp(0.5 * nu, 0.5 * x2);
}