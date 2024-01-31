const jwt = require('jsonwebtoken');
const secretKey = 'multicopverse';

module.exports.generateJWT = function (user) {
    const payload = {
        id: user._id,
        name: user.username
    };
    const token = jwt.sign(payload, getGenerateSecreteKey(), { expiresIn: '1h' });
    return token;
};

module.exports.verifyJWT = function (token, success, failed) {
    jwt.verify(token, getGenerateSecreteKey(), { ignoreExpiration: false }, (err, decoded) => {
        if (err) {
            failed(err)
        } else {
            success(decoded)
        }
    });
}

module.exports.distance = function (x1, y1, x2, y2) {
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    return distance;
}

module.exports.rotatetoTraget = function (currentAngle, targetAngle, angleSpeed) {
    let angleDifference = targetAngle - currentAngle;
    angleDifference = ((angleDifference + Math.PI) % (2 * Math.PI)) - Math.PI;
    let direction = Math.sign(angleDifference);
    let nextAngle = currentAngle + direction * angleSpeed;
    nextAngle = ((nextAngle + Math.PI) % (2 * Math.PI)) - Math.PI;
    return nextAngle;
}

module.exports.getAngle = function (x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

module.exports.getGenerateSecreteKey = function () {
    let date = new Date();
    return date.getMonth() + secretKey + date.getMonth();
}
