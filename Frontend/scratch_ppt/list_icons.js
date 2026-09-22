const Lu = require('react-icons/lu');
const wanted = ['LuEye','LuSearch','LuWrench','LuZap','LuShield','LuShieldCheck','LuShieldAlert','LuUsers','LuUserCheck','LuTrendingUp','LuActivity','LuSparkles','LuCircleCheck','LuCircleCheckBig','LuArrowUpCircle','LuTriangleAlert','LuGitBranch','LuMessageSquare','LuBot','LuClock','LuBarChart3','LuDatabase','LuWorkflow','LuFileWarning','LuRotateCcw','LuListChecks','LuGauge','LuRadar','LuNetwork'];
for (const w of wanted) {
  console.log(w, w in Lu ? 'OK' : 'MISSING');
}
