const fs = require('fs');

function fixSimulator() {
    const file = '../mobile-app/src/screens/Credit/CreditSimulatorScreen.js';
    let content = fs.readFileSync(file, 'utf8');
    
    const oldHeaderRegex = /<View style=\{styles\.header\}>\s*<Text style=\{styles\.headerTitle\}>Simulador<\/Text>\s*<\/View>/g;
    
    const newHeader = `<View style={styles.pageHeader}>
                    <Text style={styles.pageTitle}>Simulador</Text>
                </View>

                <View style={styles.imageCard}>
                    <View style={styles.iconBox}>
                        <Calculator size={32} color="#ffffff" />
                    </View>
                </View>`;
                
    content = content.replace(oldHeaderRegex, newHeader);
    
    const styleReplace = /header: \{ marginBottom: 24, marginTop: 10 \},\s*headerTitle: \{ fontSize: 28, fontWeight: '800', color: '#1e293b', letterSpacing: -0.5 \},/g;
    
    const newStyles = `pageHeader: { marginBottom: 16, marginTop: 10 },
    pageTitle: { fontSize: 28, fontWeight: '800', color: '#1e293b', letterSpacing: -0.5 },
    
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
}

function fixMyCredits() {
    const file = '../mobile-app/src/screens/Credit/MyCreditsScreen.js';
    let content = fs.readFileSync(file, 'utf8');
    
    const oldHeaderRegex = /<View style=\{styles\.header\}>\s*<Text style=\{styles\.headerTitle\}>Meus Créditos<\/Text>\s*<\/View>/g;
    
    const newHeader = `<View style={styles.pageHeader}>
                <Text style={styles.pageTitle}>Meus Créditos</Text>
            </View>

            <View style={[styles.imageCard, { marginHorizontal: 20 }]}>
                <View style={styles.iconBox}>
                    <Text style={{ fontSize: 32 }}>💳</Text>
                </View>
            </View>`;
            
    content = content.replace(oldHeaderRegex, newHeader);
    
    const styleReplace = /header: \{ marginBottom: 16, marginTop: 10, paddingHorizontal: 20 \},\s*headerTitle: \{ fontSize: 28, fontWeight: '800', color: '#1e293b', letterSpacing: -0.5 \},/g;
    
    const newStyles = `pageHeader: { marginBottom: 16, marginTop: 10, paddingHorizontal: 20 },
    pageTitle: { fontSize: 28, fontWeight: '800', color: '#1e293b', letterSpacing: -0.5 },
    
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
}

try {
    fixSimulator();
    fixMyCredits();
    console.log('Fixed screens successfully');
} catch (e) {
    console.error(e);
}
