
var RotationMatrix = [
    [ 1,  0,  0,  1],
    [ 0, -1,  1,  0],
    [-1,  0,  0, -1],
    [ 0,  1, -1,  0]
];

function Rotate90(rotation)
{
    return (rotation + 1) % 4;
}

function TransformVector(matrix, vector)
{
    return [vector[0] * matrix[0] + vector[1] * matrix[2],
            vector[0] * matrix[1] + vector[1] * matrix[3]];
}

function AddTransformedVector(a, matrix, b)
{
    var c = TransformVector(matrix, b);
    return [a[0] + c[0], a[1] + c[1]];
}
