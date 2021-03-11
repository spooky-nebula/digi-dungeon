let Selector = function () {
  this.name = 'Selector';
  this.iconPath = '/public/assets/tools/selector_icon.png';
  this.pointerPath = '/public/assets/tools/selector_pointer.png';
  this.enable = false;
  this.updateRate = 3.3333;
  this.init = () => {};
  this.update = () => {};
  this.draw = () => {};
};

let Panner = function () {
  this.name = 'Panner';
  this.iconPath = '/public/assets/tools/panner_icon.png';
  this.pointerPath = '/public/assets/tools/panner_pointer.png';
  this.enabled = false;
  this.updateRate = 3.3333;
  this.options = [
    {
      name: 'Inverted',
      html:
        '<input class="panner-inverted-picker" type="checkbox" value="inverted" checked title="inverted drag" alt="inverted drag">',
    },
  ];

  this.init = () => {};
  this.update = () => {
    if (this.dragging) {
      // Check if the mouse has moved since last update
      if (
        toolset.mouseState.x == this.lastMouseState.x &&
        toolset.mouseState.y == this.lastMouseState.y
      ) {
        return;
      }
      // Set the last known state to the newest one
      this.lastMouseState.x = toolset.mouseState.x;
      this.lastMouseState.y = toolset.mouseState.y;
      // Calculate the vector of the drag
      let vector = this.calculateMoveVector(
        toolset.mouseState,
        toolset.previousMouseState
      );
      // Inverted means you'll drag instead of pan
      if (this.inverted) {
        canvasMap.camera2d.x -= vector.x;
        canvasMap.camera2d.y -= vector.y;
      } else {
        canvasMap.camera2d.x += vector.x;
        canvasMap.camera2d.y += vector.y;
      }
    }
  };
  this.draw = (context2d) => {
    context2d.fillText(
      'x' +
        canvasMap.camera2d.x +
        ',y:' +
        canvasMap.camera2d.y +
        ',dragging:' +
        this.dragging,
      toolset.mouseState.x,
      toolset.mouseState.y
    );
  };
  this.mouseDown = (event) => {
    if (!this.enabled) {
      return;
    }
    this.updateDetails();
    this.dragging = true;
  };
  this.mouseUp = (event) => {
    if (!this.enabled) {
      return;
    }
    this.dragging = false;
  };

  this.dragging = false;
  this.inverted = true;
  this.lastMouseState = { x: 0, y: 0 };

  this.updateDetails = () => {
    this.inverted = document.querySelector(
      '.toolbar .tool .panner-inverted-picker'
    ).checked;
  };
  this.calculateMoveVector = (point1, point2) => {
    return { x: point2.x - point1.x || 0, y: point2.y - point1.y || 0 };
  };
};

let BrushieTool = function () {
  this.name = 'Brushie';
  this.iconPath = '/public/assets/tools/brushie_icon.png';
  this.pointerPath = '/public/assets/tools/brushie_pointer.png';
  this.enabled = false;
  this.updateRate = 6.6667;
  this.options = [
    {
      name: 'Colour Picker',
      html:
        '<input class="brushie-colour-picker" type="color" value="#000000">',
    },
    {
      name: 'Width Picker',
      html: '<input class="brushie-width-picker" type="number" value="1">',
    },
  ];
  this.hotKey = 'b';

  this.init = () => {};
  this.update = () => {
    if (this.drawing) {
      if (
        toolset.mouseState.x == toolset.previousMouseState.x &&
        toolset.mouseState.y == toolset.previousMouseState.y
      ) {
        return;
      }
      this.addPoint(toolset.mouseState.x, toolset.mouseState.y);
    }
  };
  this.draw = (context2d) => {
    context2d.strokeStyle = this.tempLine.color;
    context2d.lineWidth = this.tempLine.width;
    context2d.beginPath();
    this.tempLine.points.forEach((point) => {
      context2d.lineTo(point.x, point.y);
    });
    context2d.stroke();
  };
  this.mouseDown = (event) => {
    if (!this.enabled) {
      return;
    }
    this.updateDetails();
    this.drawing = true;
  };
  this.mouseUp = (event) => {
    if (!this.enabled) {
      return;
    }
    this.drawing = false;
    this.finishLine();
  };

  // TOOL PROPERTIES
  this.tempLine = {
    points: [],
    width: 1,
    color: 'black',
  };
  this.drawing = false;

  // TOOL FUNCTIONS
  this.updateDetails = () => {
    // Get the colour and width elements
    let colourPickerDOM = document.querySelector('.brushie-colour-picker');
    let widthPickerDOM = document.querySelector('.brushie-width-picker');
    // Parse their data
    if (colourPickerDOM != undefined) {
      this.tempLine.color = colourPickerDOM.value;
    }
    if (widthPickerDOM != undefined) {
      this.tempLine.width = parseInt(widthPickerDOM.value);
    }
  };
  this.addPoint = (x, y) => {
    this.tempLine.points.push({ x: x, y: y });
  };
  this.resetPoints = () => {
    this.tempLine.points = [];
  };
  this.finishLine = () => {
    // Finished line is a copy of the temp line
    let finishedLine = util.copyObject(this.tempLine);
    // Trimmed is a copy but only with the non repeated points
    let trimmedLine = util.copyObject(this.tempLine);
    trimmedLine.points = [];
    // Last point, to compare
    let lastPoint = finishedLine.points[0];
    trimmedLine.points.push({
      x: lastPoint.x - canvasMap.camera2d.x,
      y: lastPoint.y - canvasMap.camera2d.y,
    });
    // Filter the repeated points
    for (let i = 0; i < finishedLine.points.length; i++) {
      let point = finishedLine.points[i];
      if (lastPoint.x != point.x || lastPoint.y != point.y) {
        trimmedLine.points.push({
          x: point.x - canvasMap.camera2d.x,
          y: point.y - canvasMap.camera2d.y,
        });
        lastPoint = point;
      }
    }
    // If the line has less than 3 points then fuck it
    if (trimmedLine.points.length <= 3) {
      this.resetPoints();
      return;
    }
    // Add the drawing to the drawing layer
    socket.emit('drawing-add', trimmedLine);
    // Reset the temp line
    this.resetPoints();
  };
};

let TheRuller = function () {
  this.name = 'The Ruller';
  this.iconPath = '/public/assets/tools/theRuller_icon.png';
  this.pointerPath = '/public/assets/tools/theRuller_pointer.png';
  this.enabled = false;
  this.updateRate = 3.3333;
  this.init = () => {};
  this.update = () => {};
  this.draw = () => {};
};

toolset.tools.push(new Selector());
toolset.tools.push(new Panner());
toolset.tools.push(new BrushieTool());
toolset.tools.push(new TheRuller());

// Refresh forces update and reinit
toolset.forceUpdateToolbar();
