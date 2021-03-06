import { stdin } from "process";
import { emitKeypressEvents } from "readline";

interface Events {
  // The name of the event
  name?: string;

  // Whether the key is control, meta or shift
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
}

export class InputMode {
  constructor(listeners: Map<string, Function>) {
    emitKeypressEvents(stdin);
    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }

    this.parseEvents(listeners);
  }

  /**
   * @private
   *
   * Parse the string events into real event objects
   * for the purpose of comparison
   *
   * @param listeners The event listeners
   */
  private parseEvents = (listeners: Map<string, Function>): void => {
    const events: Array<string> = Array.from(listeners.keys());
    let parsedEvents: Map<Events, Function> = new Map<Events, Function>();
    for (
      let eventKeyIndex = 0;
      eventKeyIndex < events.length;
      eventKeyIndex++
    ) {
      const currentEventArray: Array<string> = events[eventKeyIndex]
        .split("+")
        .map((stringLiteral: string) => {
          return stringLiteral.trim();
        });
      let event: Events = {
        name: currentEventArray
          .filter((element: string): boolean => {
            return !["shift", "meta", "ctrl", "+"].includes(element);
          })
          .join(""),
        ctrl: currentEventArray.includes("ctrl"),
        shift: currentEventArray.includes("shift"),
        meta: currentEventArray.includes("meta"),
      };
      parsedEvents.set(event, listeners.get(events[eventKeyIndex]));
    }
    // Once finished parsing all the strings,
    // Add all these keybindings
    this.addEventListeners(parsedEvents);
  };

  /**
   * @private
   *
   * Add keybindings
   *
   * @param parsedEvents
   */
  private addEventListeners = (parsedEvents: Map<Events, Function>) => {
    stdin.on("keypress", (chunk, event: Events): void | null => {
      if (event.name == "escape") {
        process.exit();
      }
      let { name, ctrl, shift, meta } = event;
      let eventObject: Events = {
        name: name,
        ctrl: ctrl,
        shift: shift,
        meta: meta,
      };

      const keys: Array<Events> = Array.from(parsedEvents.keys());
      for (let index = 0; index < keys.length; index++) {
        const value: Events = keys[index];
        const properties = [value.name, value.ctrl, value.shift, value.meta];
        const isCurrentKey: boolean =
          properties.toString() == [name, ctrl, shift, meta].toString();
        if (isCurrentKey) {
          const executeFunction: Function | undefined = parsedEvents.get(value);
          if (executeFunction) {
            executeFunction();
          }
          break;
        }
      }
    });
  };
}
