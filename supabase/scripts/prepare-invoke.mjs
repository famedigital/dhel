import fs from 'fs';

const chunks = [
  'guides_02',
  'guides_03',
  'guides_04',
  'activities_01',
  'activities_02',
  'activities_03',
  'transform',
];

for (const c of chunks) {
  const args = JSON.parse(fs.readFileSync(`.mcp_${c}.args.json`, 'utf8'));
  fs.writeFileSync(`.invoke_${c}.json`, JSON.stringify(args));
  console.log(`prepared ${c}`);
}
