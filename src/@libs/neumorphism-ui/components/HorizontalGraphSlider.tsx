import React, {
  CSSProperties,
  ReactElement,
  ReactNode,
  useEffect,
  useState,
} from 'react';
import styled from 'styled-components';
import { Rect } from './HorizontalGraphBar';
import { HorizontalGraphSliderThumbLabel } from './HorizontalGraphSliderThumbLabel';
import { HorizontalGraphSliderThumb } from './HorizontalGraphSliderThumb';
import classNames from 'classnames';

export interface HorizontalGraphSliderProps {
  disabled?: boolean;
  coordinateSpace: Rect;
  min: number;
  max: number;
  start: number;
  end: number;
  value: number;
  stepFunction?: (nextValue: number) => number;
  onChange: (nextValue: number) => void;
  onEnter?: () => void;
  onLeave?: () => void;
  className?: string;
  children?: ReactElement;
  style?: CSSProperties;
  label?: ReactNode;
}

interface CoordinateProps {
  coordinateSpace: Rect;
}

const HorizontalGraphSliderBase = (props: HorizontalGraphSliderProps) => {
  const onMouseOver = () => {
    setState({
      isHovering: true,
      isDragging: state.isDragging,
    });
  };

  const onMouseLeave = () => {
    setState({
      isHovering: false,
      isDragging: state.isDragging,
    });
  };

  useEffect(() => {
    thumb?.addEventListener('pointerdown', onDown);
    return () => {
      thumb?.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointermove', onMove);
    };
  });

  const onDown = (event: PointerEvent) => {
    setState({
      isDragging: true,
      isHovering: state.isHovering,
    });

    thumb?.removeEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointermove', onMove);

    if (typeof props.onEnter === 'function') {
      props.onEnter();
    }

    event.stopPropagation();
    event.stopImmediatePropagation();
  };

  const onClick = (event: React.MouseEvent) => {
    onMove(event);
  };

  const onUp = (event: PointerEvent) => {
    setState({ isDragging: false, isHovering: state.isHovering });

    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointermove', onMove);
    thumb?.addEventListener('pointerdown', onDown);

    if (typeof props.onLeave === 'function') {
      props.onLeave();
    }

    event.stopPropagation();
    event.stopImmediatePropagation();
  };

  const onMove = (event: PointerEvent | React.MouseEvent) => {
    const sliderPos =
      event.clientX - (slider?.getBoundingClientRect()?.left ?? 0);
    const sliderRatio = boundedRatio(sliderPos / props.coordinateSpace.width);

    const newValue = boundedValue(stepForward(valueRange() * sliderRatio));

    props.onChange(newValue);
    event.stopPropagation();
  };

  const takeThumb = (thumb: HTMLDivElement) => {
    setThumb(thumb);
  };

  const takeSlider = (slider: HTMLDivElement) => {
    setSlider(slider);
  };

  const thumbLeft = () => {
    return (
      boundedRatio(props.value / valueRange()) * props.coordinateSpace.width
    );
  };

  const valueRange = () => {
    return props.max - props.min;
  };

  const startRatio = () => {
    return props.start / valueRange();
  };

  const endRatio = () => {
    return props.end / valueRange();
  };

  const boundedRatio = (ratio: number) => {
    return Math.max(startRatio(), Math.min(ratio, endRatio()));
  };

  const stepForward = (prev: number) => {
    return props.stepFunction?.(prev) ?? prev;
  };

  const boundedValue = (value: number) => {
    return Math.max(props.start, Math.min(value, props.end));
  };

  const { className, style, disabled, label } = props;

  const position = thumbLeft();

  const [thumb, setThumb] = useState<HTMLDivElement | undefined>(undefined);
  const [slider, setSlider] = useState<HTMLDivElement | undefined>(undefined);

  const [state, setState] = useState({
    isDragging: false,
    isHovering: false,
  });

  return (
    <div
      ref={takeSlider}
      className={className}
      style={{
        ...style,
        pointerEvents: disabled ? 'none' : undefined,
      }}
      onClick={onClick}
      onMouseOver={onMouseOver}
      onMouseLeave={onMouseLeave}
    >
      <HorizontalGraphSliderThumb
        ref={takeThumb}
        className="thumb"
        position={position}
      />
      {label && (
        <HorizontalGraphSliderThumbLabel
          className={classNames('thumb-label', {
            'thumb-label-visible': state.isHovering || state.isDragging,
          })}
          position={position}
          label={label}
        />
      )}
    </div>
  );
};

export const HorizontalGraphSlider: any = styled(
  HorizontalGraphSliderBase,
)<CoordinateProps>`
  position: absolute;
  cursor: pointer;

  .slider-disabled {
    display: none;
    pointer-events: none;
  }

  left: ${({ coordinateSpace }) => coordinateSpace.x}px;
  top: ${({ coordinateSpace }) => coordinateSpace.y}px;
  width: ${({ coordinateSpace }) => coordinateSpace.width}px;
  height: ${({ coordinateSpace }) => coordinateSpace.height}px;

  > :first-child {
    width: ${({ coordinateSpace }) => coordinateSpace.height}px;
    height: ${({ coordinateSpace }) => coordinateSpace.height}px;
    transform: translateX(
      -${({ coordinateSpace }) => coordinateSpace.height / 2}px
    );

    position: absolute;
    display: grid;
    place-content: center;

    cursor: pointer;
  }

  .thumb-label {
    transition: opacity 0.2s ease-in-out;
    opacity: 0;
  }

  .thumb-label-visible {
    opacity: 1;
  }
`;
