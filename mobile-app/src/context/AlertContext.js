import React, { createContext, useContext, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react-native';

const AlertContext = createContext({});

export const AlertProvider = ({ children }) => {
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info', // 'success', 'error', 'warning', 'info'
        buttons: []
    });

    const showAlert = (title, message, buttons = [], type = 'info') => {
        // Se buttons for uma string (passaram o type no lugar dos buttons)
        if (typeof buttons === 'string') {
            type = buttons;
            buttons = [];
        }

        // Se nenhum botão for passado, adicionamos o botão OK padrão
        if (!Array.isArray(buttons) || buttons.length === 0) {
            buttons = [{ text: 'OK', onPress: () => {} }];
        }
        
        // Infer type from title if not explicitly provided
        let inferredType = type;
        if (title) {
            const lowerTitle = title.toLowerCase();
            if (lowerTitle.includes('erro') || lowerTitle.includes('falha')) inferredType = 'error';
            else if (lowerTitle.includes('sucesso')) inferredType = 'success';
            else if (lowerTitle.includes('atenção') || lowerTitle.includes('certeza')) inferredType = 'warning';
        }

        setAlertConfig({
            visible: true,
            title,
            message,
            buttons,
            type: inferredType
        });
    };

    const hideAlert = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    };

    const handlePress = (onPress) => {
        hideAlert();
        if (onPress) {
            setTimeout(() => {
                onPress();
            }, 100);
        }
    };

    const renderIcon = () => {
        switch (alertConfig.type) {
            case 'success': return <View style={[styles.iconWrapper, { backgroundColor: '#dcfce7' }]}><CheckCircle size={32} color="#10b981" /></View>;
            case 'error': return <View style={[styles.iconWrapper, { backgroundColor: '#fee2e2' }]}><AlertCircle size={32} color="#ef4444" /></View>;
            case 'warning': return <View style={[styles.iconWrapper, { backgroundColor: '#fef3c7' }]}><AlertCircle size={32} color="#f59e0b" /></View>;
            default: return <View style={[styles.iconWrapper, { backgroundColor: '#e0f2fe' }]}><Info size={32} color="#0ea5e9" /></View>;
        }
    };

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}
            <Modal
                visible={alertConfig.visible}
                transparent={true}
                animationType="fade"
                onRequestClose={hideAlert}
            >
                <View style={styles.overlay}>
                    <View style={styles.alertBox}>
                        {renderIcon()}
                        
                        {alertConfig.title ? (
                            <Text style={styles.title}>{alertConfig.title}</Text>
                        ) : null}
                        
                        <Text style={styles.message}>{alertConfig.message}</Text>
                        
                        <View style={styles.buttonsContainer}>
                            {alertConfig.buttons.map((btn, index) => {
                                const isCancel = btn.style === 'cancel';
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.button,
                                            isCancel ? styles.buttonCancel : styles.buttonConfirm,
                                            alertConfig.buttons.length > 1 && { flex: 1, marginHorizontal: 4 } // Espalha caso haja mais de 1
                                        ]}
                                        onPress={() => handlePress(btn.onPress)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[
                                            styles.buttonText,
                                            isCancel ? styles.buttonTextCancel : styles.buttonTextConfirm
                                        ]}>
                                            {btn.text}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>
            </Modal>
        </AlertContext.Provider>
    );
};

export const useAlert = () => useContext(AlertContext);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    alertBox: {
        backgroundColor: '#fff',
        width: '100%',
        maxWidth: 340,
        borderRadius: 28,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 10,
    },
    iconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 100,
    },
    buttonConfirm: {
        backgroundColor: '#3b82f6',
    },
    buttonCancel: {
        backgroundColor: '#f1f5f9',
    },
    buttonText: {
        fontSize: 15,
        fontWeight: '700',
    },
    buttonTextConfirm: {
        color: '#fff',
    },
    buttonTextCancel: {
        color: '#64748b',
    }
});
