const fs = require('fs');
const file = 'c:/Users/Lenovo/Downloads/servdco-main/client/pages/AdminDashboard.tsx';
const lines = fs.readFileSync(file, 'utf-8').split('\n');
const newLines = [
  ...lines.slice(0, 70),
  'import { MarketInterestRequests } from "@/components/admin/MarketInterestRequests";',
  ...lines.slice(70, 2473),
  '            {activeNav === "interest_requests" && (',
  '              <MarketInterestRequests',
  '                interestRequests={interestRequests}',
  '                interestSearch={interestSearch}',
  '                setInterestSearch={setInterestSearch}',
  '                interestRoleFilter={interestRoleFilter}',
  '                setInterestRoleFilter={setInterestRoleFilter}',
  '              />',
  '            )}',
  ...lines.slice(2854)
];
fs.writeFileSync(file, newLines.join('\n'));
