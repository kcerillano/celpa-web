const format = /[ !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

function isValidInput(input) {
    return !format.test(input);
}

module.exports = {
    isValidInput
}