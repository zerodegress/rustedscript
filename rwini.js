/** @type {(ini: import("./types").RWIni) => import("./types").RWIni} */
export function optimize(ini) {
  /** @type {import("./types").RWIniSection[]} */
  const init = []
  return {
    ...ini,
    sections: ini.sections.reduce(
      (secs, sec) => [
        ...secs,
        {
          ...sec,
          props: sec.props.reduce((props, prop) => {
            if (props.find(x => x[0] === prop[0])) {
              return [...props.filter(x => x[0] !== prop[0]), prop]
            }
            return [...props, prop]
          }, []),
        },
      ],
      init,
    ),
  }
}

/** @type {(ini: import("./types").RWIni) => string} */
export function compile(ini) {
  return ini.sections.reduce((p, sec) => {
    return `${p}[${sec.name}]${sec.props.length > 0 ? '\n' : ''}${sec.props.map(([k, v]) => `${k}:${v}`).join('\n')}\n`
  }, '')
}
