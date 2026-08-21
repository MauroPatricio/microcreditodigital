const fs = require('fs');
const file = '../mobile-app/src/screens/Credit/MyCreditsScreen.js';
let content = fs.readFileSync(file, 'utf8');

const oldTimerRegex = /const CountdownTimer = \(\{ createdAt \}\) => \{[\s\S]*?return \([\s\S]*?<\/View>\s*\);\s*\};/g;

const newTimer = `const CountdownTimer = ({ credit, onInsist }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isZero, setIsZero] = useState(false);
    const [insisting, setInsisting] = useState(false);

    useEffect(() => {
        if (!credit || !credit.createdAt) return;
        const calculateTimeLeft = () => {
            const targetTime = new Date(credit.createdAt).getTime() + 30 * 60000;
            const now = new Date().getTime();
            const diff = targetTime - now;

            if (diff <= 0) {
                setIsZero(true);
                return '00:00';
            }

            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            return \`\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, [credit]);

    if (isZero) {
        return (
            <TouchableOpacity 
                style={{ backgroundColor: '#f59e0b', padding: 8, borderRadius: 8, marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                onPress={async () => {
                    setInsisting(true);
                    if (onInsist) await onInsist(credit._id);
                    setInsisting(false);
                }}
                disabled={insisting}
            >
                {insisting ? <ActivityIndicator color="#fff" size="small" /> : (
                    <>
                        <AlertCircle size={16} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Alertar Finanças</Text>
                    </>
                )}
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.countdownWrapper}>
            <Timer size={14} color="#059669" style={{ marginRight: 6 }} />
            <Text style={styles.countdownText}>
                Desembolso em {timeLeft}
            </Text>
        </View>
    );
};`;

content = content.replace(oldTimerRegex, newTimer);

// Add handleInsist
const myCreditsRegex = /const \[refreshing, setRefreshing\] = useState\(false\);/;
const handleInsistCode = `const [refreshing, setRefreshing] = useState(false);
    const { showAlert } = useAlert();

    const handleInsist = async (creditId) => {
        try {
            await api.post(\`/credits/request/\${creditId}/insist\`);
            showAlert('Sucesso', 'Equipa de finanças foi alertada com sucesso!', 'success');
        } catch (error) {
            showAlert('Erro', 'Não foi possível enviar o alerta.', 'error');
        }
    };`;
content = content.replace(myCreditsRegex, handleInsistCode);

if (!content.includes("import { useAlert }")) {
    content = content.replace("import { creditService } from '../../services';", "import { creditService } from '../../services';\nimport api from '../../services/api';\nimport { useAlert } from '../../context/AlertContext';");
}

if (!content.includes("ActivityIndicator")) {
    content = content.replace("SafeAreaView", "SafeAreaView, ActivityIndicator");
}

if (!content.includes("AlertCircle")) {
    content = content.replace("AlertTriangle,", "AlertTriangle, AlertCircle,");
}

// Fix <CountdownTimer createdAt={item.createdAt} />
content = content.replace(/<CountdownTimer createdAt=\{item\.createdAt\} \/>/g, '<CountdownTimer credit={item} onInsist={handleInsist} />');

fs.writeFileSync(file, content);
console.log('Fixed MyCreditsScreen');

// Also fix HomeScreen imports if needed
const homeFile = '../mobile-app/src/screens/Home/HomeScreen.js';
let homeContent = fs.readFileSync(homeFile, 'utf8');
if (!homeContent.includes("ActivityIndicator")) {
    homeContent = homeContent.replace("SafeAreaView", "SafeAreaView, ActivityIndicator");
    fs.writeFileSync(homeFile, homeContent);
    console.log('Fixed HomeScreen ActivityIndicator import');
}
