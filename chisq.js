// JavaScript Document
// Chisquared distribution
// Require Gamma functions

function pchisq(x2, nu) {
    if (!x2 || !nu) {
        alert('Error: Both x and number of degrees of freedom are required for Chi-squared distribution.');
        return;
    }
    if (x2 <= 0) {
        alert('Error: Bad x in Chi-squared distribution. x must be greater then 0.');
        return;
    }
    if (nu <= 0) {
        alert('Error: Bad number of degrees of freedom in Chi-squared distribution. It must be greater than 0.');
        return;
    }
    return gammp(0.5 * nu, 0.5 * x2);
}