const jwt = require('jsonwebtoken');
module.exports.generateJWT = function (user) {

    // Create a JWT payload
    const payload = {
        id: user._id,
        username: user.username
    };

    // Sign the JWT using a secret key
    const token = jwt.sign(payload, 'my-game', { expiresIn: '1h' });

    // Return the JWT
    return token;
};


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
