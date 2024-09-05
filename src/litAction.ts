// @ts-nocheck

const _litActionCode = async () => {
    if (magicNumber >= 42) {
        LitActions.setResponse({ response: "true" });
    } else {
        LitActions.setResponse({ response: "The number is less than 42!" });
    }
  }
  
export const litActionCode = `(${_litActionCode.toString()})();`;