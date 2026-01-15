const toolboxReducer = (state, action) => {
  switch (action.type) {
    case 'SET_STROKE_COLOR':
      return {
        ...state,
        [action.tool.name]: {
          ...state[action.tool.name],
          stroke: action.color,
        },
      };
    case 'SET_FILL_COLOR':
      return {
        ...state,
        [action.tool.name]: {
          ...state[action.tool.name],
          fillcolor: action.color,
        },
      };
    case 'SET_STROKE_WIDTH':
      return {
        ...state,
        [action.tool.name]: {
          ...state[action.tool.name],
          size: action.width,
        },
      };
    case 'SET_FILL_STYLE':
      return {
        ...state,
        [action.tool.name]: {
          ...state[action.tool.name],
          fillStyle: action.fillStyle,
        },
      };
    case 'SET_PENCIL_PROP':
      return {
        ...state,
        [action.tool.name]: {
          ...state[action.tool.name],
          [action.prop]: action.value,
        },
      };
    case 'SET_FONT_SIZE':
      return {
        ...state,
        [action.tool.name]: {
          ...state[action.tool.name],
          fontSize: action.fontSize,
        },
      };
    default:
      return state;
  }
};

export default toolboxReducer;
