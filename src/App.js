import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { TransitionMotion, spring, presets, Motion } from 'react-motion';
import range from 'lodash.range';

function reinsert(arr, from, to) {
  const _arr = arr.slice(0);
  const val = _arr[from];
  _arr.splice(from, 1);
  _arr.splice(to, 0, val);
  return _arr;
}

function clamp(n, min, max) {
  return Math.max(Math.min(n, max), min);
}

const springConfig = { stiffness: 300, damping: 50 };
const itemsCount = 4;


export default class Demo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      todos: [
        // key is creation date
        { key: 't1', data: { text: 'Board the plane', isDone: false } },
        { key: 't2', data: { text: 'Sleep', isDone: false } },
        { key: 't3', data: { text: 'Try to finish conference slides', isDone: false } },
        // { key: 't4', data: { text: 'Eat cheese and drink wine', isDone: false } },
        // { key: 't5', data: { text: 'Go around in Uber', isDone: false } },
        // { key: 't6', data: { text: 'Talk with conf attendees', isDone: false } },
        // { key: 't7', data: { text: 'Show Demo 1', isDone: false } },
        // { key: 't8', data: { text: 'Show Demo 2', isDone: false } },
        // { key: 't9', data: { text: 'Lament about the state of animation', isDone: false } },
        // { key: 't10', data: { text: 'Show Secret Demo', isDone: false } },
        // { key: 't11', data: { text: 'Go home', isDone: false } },
      ],
      value: '',
      selected: 'all',
      topDeltaY: 0,
      mouseY: 0,
      isPressed: false,
      originalPosOfLastPressed: 0,
      order: range(itemsCount),
    };
  };
  componentDidMount() {
    window.addEventListener('touchmove', this.handleTouchMove);
    window.addEventListener('touchend', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
  };

  handleTouchStart = (key, pressLocation, e) => {
    this.handleMouseDown(key, pressLocation, e.touches[0]);
  };

  handleTouchMove = (e) => {
    e.preventDefault();
    this.handleMouseMove(e.touches[0]);
  };

  handleMouseDown = (pos, pressY, { pageY }) => {
    this.setState({
      topDeltaY: pageY - pressY,
      mouseY: pressY,
      isPressed: true,
      originalPosOfLastPressed: pos,
    });
  };

  handleMouseMove = ({ pageY }) => {
    const { isPressed, topDeltaY, order, originalPosOfLastPressed } = this.state;

    if (isPressed) {
      const mouseY = pageY - topDeltaY;
      const currentRow = clamp(Math.round(mouseY / 100), 0, itemsCount - 1);
      let newOrder = order;

      if (currentRow !== order.indexOf(originalPosOfLastPressed)) {
        newOrder = reinsert(order, order.indexOf(originalPosOfLastPressed), currentRow);
      }

      this.setState({ mouseY: mouseY, order: newOrder });
    }
  };

  handleMouseUp = () => {
    this.setState({ isPressed: false, topDeltaY: 0 });
  };


  // logic from todo, unrelated to animation
  handleChange = ({ target: { value } }) => {
    this.setState({ value });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    const newItem = {
      key: 't' + Date.now(),
      data: { text: this.state.value, isDone: false },
    };
    // append at head
    this.setState({ todos: [newItem].concat(this.state.todos) });
  };

  handleDone = (doneKey) => {
    this.setState({
      todos: this.state.todos.map(todo => {
        const { key, data: { text, isDone } } = todo;
        return key === doneKey
          ? { key: key, data: { text: text, isDone: !isDone } }
          : todo;
      }),
    });
  };

  handleToggleAll = () => {
    const allNotDone = this.state.todos.every(({ data }) => data.isDone);
    this.setState({
      todos: this.state.todos.map(({ key, data: { text, isDone } }) => (
        { key: key, data: { text: text, isDone: !allNotDone } }
      )),
    });
  };

  handleSelect = (selected) => {
    this.setState({ selected });
  };

  handleClearCompleted = () => {
    this.setState({ todos: this.state.todos.filter(({ data }) => !data.isDone) });
  };

  handleDestroy = (date) => {
    this.setState({ todos: this.state.todos.filter(({ key }) => key !== date) });
  };

  // actual animation-related logic
  getDefaultStyles = () => {
    return this.state.todos.map(todo => ({ ...todo, style: { height: 0, opacity: 1 } }));
  };

  getStyles = () => {
    const { todos, value, selected } = this.state;
    return todos.filter(({ data: { isDone, text } }) => {
      return text.toUpperCase().indexOf(value.toUpperCase()) >= 0 &&
        (selected === 'completed' && isDone ||
          selected === 'active' && !isDone ||
          selected === 'all');
    })
      .map((todo, i) => {
        return {
          ...todo,
          style: {
            height: spring(60, presets.gentle),
            opacity: spring(1, presets.gentle),
          }
        };
      });
  };

  willEnter() {
    return {
      height: 0,
      opacity: 1,
    };
  };

  willLeave() {
    return {
      height: spring(0),
      opacity: spring(0),
    };
  };



  render() {
    const { todos, value, selected } = this.state;
    const { mouseY, isPressed, originalPosOfLastPressed, order } = this.state;

    const itemsLeft = todos.filter(({ data: { isDone } }) => !isDone).length;
    return (
      <section className="todoapp">
        <header className="header">
          <h1>todos</h1>
          <form onSubmit={this.handleSubmit}>
            <input
              autoFocus={true}
              className="new-todo"
              placeholder="What needs to be done?"
              value={value}
              onChange={this.handleChange}
            />
          </form>
        </header>
        <section className="main">
          <input
            className="toggle-all"
            type="checkbox"
            checked={itemsLeft === 0} style={{ display: todos.length === 0 ? 'none' : 'inline' }}
            onChange={this.handleToggleAll} />
          <TransitionMotion
            defaultStyles={this.getDefaultStyles()}
            styles={this.getStyles()}
            willLeave={this.willLeave}
            willEnter={this.willEnter}>
            {styles =>
              <ul className="todo-list">
                {styles.map(({ key, style, data: { isDone, text } }, i) => {
                  console.log(i)

                  style = originalPosOfLastPressed === i && isPressed
                    ? {
                      scale: spring(1.1, springConfig),
                      shadow: spring(16, springConfig),
                      y: mouseY,
                      color: 'green'
                    }
                    : {
                      scale: spring(1, springConfig),
                      shadow: spring(1, springConfig),
                      y: spring(order.indexOf(i) * 100, springConfig),
                      color: 'red'

                    };

                  return (
                    <Motion style={style} key={i}>
                      {({ scale, shadow, y }) =>
                        <li
                          onMouseDown={this.handleMouseDown.bind(null, i, y)}
                          onTouchStart={this.handleTouchStart.bind(null, i, y)}
                          className="demo8-item"
                          style={{
                            boxShadow: `rgba(0, 0, 0, 0.2) 0px ${shadow}px ${2 * shadow}px 0px`,
                            transform: `translate3d(0, ${y}px, 0) scale(${scale})`,
                            WebkitTransform: `tra nslate3d(0, ${y}px, 0) scale(${scale})`,
                            zIndex: i === originalPosOfLastPressed ? 99 : i,
                          }}>
                          {order.indexOf(i) + 1}
                          <li key={key} style={style} className={isDone ? 'completed' : ''}>
                            <div className="view">
                              <input
                                className="toggle"
                                type="checkbox"
                                onChange={this.handleDone.bind(null, key)}
                                checked={isDone}
                              />
                              <label>{text}</label>
                              <button
                                className="destroy"
                                onClick={this.handleDestroy.bind(null, key)}
                              />
                            </div>
                          </li>
                        </li>
                      }
                    </Motion>

                  )
                }
                )}
              </ul>
            }
          </TransitionMotion>
        </section>
        <footer className="footer">
          <span className="todo-count">
            <strong>
              {itemsLeft}
            </strong> {itemsLeft === 1 ? 'item' : 'items'} left
          </span>
          <ul className="filters">
            <li>
              <a
                className={selected === 'all' ? 'selected' : ''}
                onClick={this.handleSelect.bind(null, 'all')}>
                All
              </a>
            </li>
            <li>
              <a
                className={selected === 'active' ? 'selected' : ''}
                onClick={this.handleSelect.bind(null, 'active')}>
                Active
              </a>
            </li>
            <li>
              <a
                className={selected === 'completed' ? 'selected' : ''}
                onClick={this.handleSelect.bind(null, 'completed')}>
                Completed
              </a>
            </li>
          </ul>
          <button className="clear-completed" onClick={this.handleClearCompleted}>
            Clear completed
          </button>
        </footer>
      </section>
    );
  };


  // render() {
  //   const {mouseY, isPressed, originalPosOfLastPressed, order} = this.state;

  //   return (
  //     <div className="demo8">
  //       {range(itemsCount).map(i => {
  //         // const style = originalPosOfLastPressed === i && isPressed
  //         //   ? {
  //         //       scale: spring(1.1, springConfig),
  //         //       shadow: spring(16, springConfig),
  //         //       y: mouseY,
  //         //     }
  //         //   : {
  //         //       scale: spring(1, springConfig),
  //         //       shadow: spring(1, springConfig),
  //         //       y: spring(order.indexOf(i) * 100, springConfig),
  //         //     };
  //         return (
  //           <Motion style={style} key={i}>
  //             {({scale, shadow, y}) =>
  //               <div
  //                 onMouseDown={this.handleMouseDown.bind(null, i, y)}
  //                 onTouchStart={this.handleTouchStart.bind(null, i, y)}
  //                 className="demo8-item"
  //                 style={{
  //                   boxShadow: `rgba(0, 0, 0, 0.2) 0px ${shadow}px ${2 * shadow}px 0px`,
  //                   transform: `translate3d(0, ${y}px, 0) scale(${scale})`,
  //                   WebkitTransform: `translate3d(0, ${y}px, 0) scale(${scale})`,
  //                   zIndex: i === originalPosOfLastPressed ? 99 : i,
  //                 }}>
  //                 {order.indexOf(i) + 1}
  //               </div>
  //             }
  //           </Motion>
  //         );
  //       })}
  //     </div>
  //   );
  //};

}

//export default App;
