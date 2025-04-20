import React, { useState } from 'react';
import { usePopper } from 'react-popper';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';

const Tooltip = ({ content, children, position = 'top' }) => {
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const [arrowElement, setArrowElement] = useState(null);
  const [visible, setVisible] = useState(false);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: position,
    modifiers: [
      { name: 'arrow', options: { element: arrowElement } },
      { name: 'offset', options: { offset: [0, 12] } },
      { 
        name: 'computeStyles',
        options: {
          gpuAcceleration: false
        }
      },
      {
        name: 'preventOverflow',
        options: {
          boundary: 'viewport',
          padding: 12,
          altAxis: true,
          altBoundary: true
        }
      },
      {
        name: 'flip',
        options: {
          padding: 12,
          fallbackPlacements: ['bottom', 'right', 'left']
        }
      }
    ],
  });

  return (
    <>
      <div
        ref={setReferenceElement}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="inline-block cursor-default"
      >
        {children}
      </div>
      {visible && createPortal(
        <div
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
          className="z-[9999] px-4 py-3 text-sm leading-6 text-white bg-gray-800 rounded max-w-[800px] whitespace-normal break-words shadow-lg"
        >
          {content}
          <div
            ref={setArrowElement}
            style={styles.arrow}
            className={`
              w-2 h-2 bg-gray-800 transform rotate-45 absolute -z-10
              ${position === 'top' ? 'bottom-[-4px]' :
                position === 'bottom' ? 'top-[-4px]' :
                position === 'left' ? 'right-[-4px]' :
                'left-[-4px]'}
            `}
          />
        </div>
      , document.body)}
    </>
  );
};

Tooltip.propTypes = {
  content: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  position: PropTypes.oneOf(['top', 'bottom', 'left', 'right'])
};

export default Tooltip;
