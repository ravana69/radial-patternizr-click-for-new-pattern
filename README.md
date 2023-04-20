# Radial Patternizr (click for new pattern)

A Pen created on CodePen.io. Original URL: [https://codepen.io/Roman_Murashov/pen/BaNJOXa](https://codepen.io/Roman_Murashov/pen/BaNJOXa).

Generate interesting radial patterns with randomized parameters, or create your own shape.  Built with webGL and Dat.GUI.

More information on the control panel values:

  The `numerator`, `denominator`, and `panel` values are GLSL fragments that are compiled directly into the webGL program.  The tokens in these expressions are the variables in the webGL code - the three chosen colors (`col1, col2, col3`) plus four shapes calculated from those colors (`s1, s2, s3, s4`) - which are then combined in an arithmetic expression along the lines of `(numerator/denominator)*panel`  to produce a result.   For these values,  any valid  GLSL expression or function is allowed, such as `sqrt(s1+col2) + cos(s4)`.



