/**
 * String localization macro - This function is only used at compile time
 * and will be replaced by string key references during the build process.
 * 
 * Usage: s`Your string here`
 * Result: mod.stringkeys.string_xxxxx
 */
export function s(strings: TemplateStringsArray, ...values: any[]): string {
  // This function is stripped out during build
  // It's only here for type checking
  return strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '');
}
