
exports.atoi = function (str) {
    var val = 0;
    for (var i = 0; i < str.length; i++) {
        var c = str[i] - '0';
        if (isNaN(c)) {
            return NaN;
        }

        val = (val * 10) + c;
    }

	return val;
};
