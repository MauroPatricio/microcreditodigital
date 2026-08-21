const fs = require('fs');
const file = '../mobile-app/src/screens/Credit/RequestCreditScreen.js';
let content = fs.readFileSync(file, 'utf8');

const oldHeaderRegex = /<View style=\{styles\.header\}>\s*<Text style=\{styles\.title\}>Confirmar Crédito<\/Text>\s*<Text style=\{styles\.subtitle\}>Falta pouco! Escolha como prefere receber o seu dinheiro\.<\/Text>\s*<\/View>/g;

const newHeader = `<View style={styles.pageHeader}>
                    <Text style={styles.pageTitle}>Confirmar Crédito</Text>
                    <Text style={styles.pageSubtitle}>Falta pouco! Escolha como prefere receber o seu dinheiro.</Text>
                </View>

                <View style={[styles.imageCard, { marginHorizontal: 20 }]}>
                    <View style={styles.iconBox}>
                        <CheckCircle size={32} color="#ffffff" />
                    </View>
                </View>`;
                
content = content.replace(oldHeaderRegex, newHeader);

const styleReplace = /header: \{\s*backgroundColor: '#2563eb',\s*padding: 24,\s*paddingTop: 40,\s*\},/g;

const newStyles = `pageHeader: { marginBottom: 16, marginTop: 10, paddingHorizontal: 20 },
    pageTitle: { fontSize: 28, fontWeight: '800', color: '#1e293b', letterSpacing: -0.5 },
    pageSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
    
    imageCard: {
        backgroundColor: '#2563eb',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
    },
    iconBox: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },`;
    
content = content.replace(styleReplace, newStyles);
fs.writeFileSync(file, content);
console.log('Fixed RequestCreditScreen');
