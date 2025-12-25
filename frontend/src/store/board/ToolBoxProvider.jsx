import React,{useReducer} from "react";
import toolboxContext from "./toolbar-context";
import { COLORS, FILL_STYLES, TOOL_ACTION_TYPE, TOOLS } from "../../utils/constants";
function toolboxReducer(state, action){
    console.log('Toolbox Reducer Action:', action); 
    
    switch(action.type){
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
        default:
            return state;
    }
}

const initialToolBoxState={
    [TOOLS.PENCIL.name]: {
        stroke: COLORS.Black,
        size: 1
    },
    [TOOLS.CIRCLE.name]: {
        stroke: COLORS.Black,
        size: 1,
        fillcolor: null,
        fillStyle: FILL_STYLES.HACHURE
    },
    [TOOLS.RECTANGLE.name]: {
        stroke: COLORS.Black,
        size: 1,
        fillcolor: null,
        fillStyle: FILL_STYLES.HACHURE
    },
    [TOOLS.DIAMOND.name]: {
        stroke: COLORS.Black,
        size: 1,
        fillcolor: null,
        fillStyle: FILL_STYLES.HACHURE
    },
    [TOOLS.ARROW.name]: {
        stroke: COLORS.Black,
        size: 1
    },
    [TOOLS.LINE.name]: {
        stroke: COLORS.Black,
        size: 1
    },
    [TOOLS.ERASER.name]: {
        size: 1
    }
}



const ToolBoxProvider= ({children})=>{
    
    const [toolBoxState,dispatchToolBoxAction]=useReducer(toolboxReducer,initialToolBoxState); 
    
    const toolBoxContextValue={toolBoxState,dispatchToolBoxAction};

    return (
        <toolboxContext.Provider value={toolBoxContextValue}>{children}</toolboxContext.Provider>
    )
}
export default ToolBoxProvider;