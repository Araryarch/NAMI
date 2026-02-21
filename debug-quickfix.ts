import { DiagnosticEngine } from './src/tooling/diagnostic/diagnostic-engine';
import { QuickFixProvider } from './src/tooling/diagnostic/quick-fixes';

const source = `loop {
  break;
  print(_ + false);
}`;

const diagnosticEngine = new DiagnosticEngine();
const quickFixProvider = new QuickFixProvider();

console.log('Original source:');
console.log(source);
console.log('\n---\n');

const diagnostics = diagnosticEngine.analyze(source);
console.log('Diagnostics:', diagnostics.length);
for (const d of diagnostics) {
  console.log(`- ${d.code}: ${d.message} at line ${d.range.start.line}`);
}
console.log('\n---\n');

const unreachableDiagnostic = diagnostics.find(
  d => d.code === 'UNREACHABLE_CODE' && d.quickFixes.length > 0
);

if (unreachableDiagnostic) {
  console.log('Found unreachable diagnostic with quick fix');
  const quickFix = unreachableDiagnostic.quickFixes[0];
  console.log('Quick fix:', quickFix.title);
  console.log('Edit range:', quickFix.edits[0].range);
  
  const fixedSource = quickFixProvider.applyQuickFix(source, quickFix);
  console.log('\nFixed source:');
  console.log(fixedSource);
  console.log('\n---\n');
  
  const newDiagnostics = diagnosticEngine.analyze(fixedSource);
  console.log('New diagnostics:', newDiagnostics.length);
  for (const d of newDiagnostics) {
    console.log(`- ${d.code}: ${d.message} at line ${d.range.start.line}`);
  }
  
  const oldUnreachable = diagnostics.filter(d => d.code === 'UNREACHABLE_CODE').length;
  const newUnreachable = newDiagnostics.filter(d => d.code === 'UNREACHABLE_CODE').length;
  console.log(`\nOld unreachable: ${oldUnreachable}, New unreachable: ${newUnreachable}`);
}
