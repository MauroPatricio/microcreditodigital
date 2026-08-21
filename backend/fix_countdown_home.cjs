const fs = require('fs');
const file = '../mobile-app/src/screens/Home/HomeScreen.js';
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

// Add handleInsist to HomeScreen
const homeScreenRegex = /const \[refreshing, setRefreshing\] = useState\(false\);/;
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
content = content.replace(homeScreenRegex, handleInsistCode);

// Add useAlert import if not there
if (!content.includes("import { useAlert }")) {
    content = content.replace("import api from '../../services/api';", "import api from '../../services/api';\nimport { useAlert } from '../../context/AlertContext';");
}

// Fix <CountdownTimer createdAt={pendingCredit.createdAt} />
content = content.replace(/<CountdownTimer createdAt=\{pendingCredit\.createdAt\} \/>/g, '<CountdownTimer credit={pendingCredit} onInsist={handleInsist} />');

fs.writeFileSync(file, content);
console.log('Fixed HomeScreen');
