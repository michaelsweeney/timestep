// Manual one-click check of the native dialog on the host OS. Run in a
// GRAPHICAL session (osascript needs Aqua + an Automation grant; WinForms
// needs an interactive desktop) — it cannot be driven over plain SSH. Pops the
// picker; prints the sanitized result.
//   node --import tsx scripts/serve-dialog-check.mjs
import { makeDialogs } from '../app/serve/dialog.ts';

const d = makeDialogs();
const res = await d.openDialog({ properties: ['multiSelections'] });
console.log(JSON.stringify(res));
