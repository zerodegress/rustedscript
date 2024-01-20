/** @type {(ini: import("./types").RWIni) => string} */
export function compile(ini) {
  return ini.sections.reduce((p, sec) => {
    return `${p}[${sec.name}]${sec.props.length > 0 ? '\n' : ''}${sec.props.map(([k, v]) => `${k}:${v}`).join('\n')}\n`
  }, '')
}
