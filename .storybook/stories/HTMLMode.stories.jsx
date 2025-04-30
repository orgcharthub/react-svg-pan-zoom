import React, {useEffect, useRef} from "react";
import UncontrolledHTMLViewer from '../../src/uncontrolled-html-viewer';

export default {
  title: "HTMLViewer",
  component: UncontrolledHTMLViewer
};

const Template = args => {
  const Viewer = useRef(null);

  useEffect(() => {
    Viewer.current.fitToViewer();
  }, []);

  return (
    <UncontrolledHTMLViewer
    {...args}
    tool={'auto'}
    width={400}
    height={400}
    customBackground={(props) => {
      return <div style={{
        backgroundColor: "rgba(255,255,0,0.8)",
        width: props.value.viewerWidth,
        height: props.value.viewerHeight,
        position: "absolute",
        pointerEvents: "none"
      }}></div>
    
    }}
    ref={Viewer}>
      <div width={1440} height={1440}>
        <div style={{
          backgroundColor: "red",
          width: 100,
          height: 100,
          position: "absolute",
          top: 100,
          left: 100
        }}></div>
      </div>
    </UncontrolledHTMLViewer>
  )
}

export const Primary = Template.bind({});
Primary.args = {};
