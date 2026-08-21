import React, { useState } from 'react';
import { View, StyleSheet, Text, Switch, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../../theme/ThemeContext';
import PremiumInput from '../../../../components/PremiumInput';
import { DollarSign, Percent, TrendingDown } from 'lucide-react-native';
import { spacing, typography, borderRadius } from '../../../../theme/typography';

export default function FinancialInfoStep({ formData, updateData }) {
  const { colors, isDarkMode } = useTheme();

  // Helper to parse numbers safely
  const parseNum = (val) => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Auto calculate incomes and expenses
  const mainIncome = parseNum(formData.mainIncome);
  const otherIncome = parseNum(formData.otherIncome);
  const totalIncome = mainIncome + otherIncome;

  const expenses = [
    'foodExpense', 'rentExpense', 'educationExpense', 'transportExpense', 
    'energyExpense', 'waterExpense', 'telecomExpense', 'healthExpense', 'otherExpense'
  ];
  
  const totalExpenses = expenses.reduce((acc, exp) => acc + parseNum(formData[exp]), 0);
  const netIncome = totalIncome - totalExpenses;

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Rendimentos Mensais</Text>
      
      <PremiumInput
        label="Rendimento Principal"
        placeholder="0.00"
        value={formData.mainIncome}
        onChangeText={(text) => updateData({ mainIncome: text })}
        keyboardType="numeric"
        icon={DollarSign}
      />
      <PremiumInput
        label="Outros Rendimentos"
        placeholder="0.00"
        value={formData.otherIncome}
        onChangeText={(text) => updateData({ otherIncome: text })}
        keyboardType="numeric"
      />

      <View style={[styles.summaryBox, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
        <Text style={[styles.summaryLabel, { color: colors.text.secondary }]}>Rendimento Mensal Total</Text>
        <Text style={[styles.summaryValue, { color: colors.primary }]}>{totalIncome.toFixed(2)} MZN</Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text.primary, marginTop: spacing.lg }]}>Despesas Estimadas (Mensais)</Text>
      
      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: spacing.xs }}>
          <PremiumInput label="Alimentação" placeholder="0.00" keyboardType="numeric" value={formData.foodExpense} onChangeText={(text) => updateData({ foodExpense: text })} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.xs }}>
          <PremiumInput label="Renda/Casa" placeholder="0.00" keyboardType="numeric" value={formData.rentExpense} onChangeText={(text) => updateData({ rentExpense: text })} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: spacing.xs }}>
          <PremiumInput label="Educação" placeholder="0.00" keyboardType="numeric" value={formData.educationExpense} onChangeText={(text) => updateData({ educationExpense: text })} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.xs }}>
          <PremiumInput label="Transporte" placeholder="0.00" keyboardType="numeric" value={formData.transportExpense} onChangeText={(text) => updateData({ transportExpense: text })} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: spacing.xs }}>
          <PremiumInput label="Energia" placeholder="0.00" keyboardType="numeric" value={formData.energyExpense} onChangeText={(text) => updateData({ energyExpense: text })} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.xs }}>
          <PremiumInput label="Água" placeholder="0.00" keyboardType="numeric" value={formData.waterExpense} onChangeText={(text) => updateData({ waterExpense: text })} />
        </View>
      </View>

      <View style={[styles.summaryBox, { backgroundColor: colors.surface, borderColor: colors.status.error }]}>
        <Text style={[styles.summaryLabel, { color: colors.text.secondary }]}>Total de Despesas</Text>
        <Text style={[styles.summaryValue, { color: colors.status.error }]}>{totalExpenses.toFixed(2)} MZN</Text>
      </View>

      <View style={[styles.summaryBox, { backgroundColor: colors.surface, borderColor: netIncome >= 0 ? colors.status.success : colors.status.error }]}>
        <Text style={[styles.summaryLabel, { color: colors.text.secondary }]}>Rendimento Líquido Disponível</Text>
        <Text style={[styles.summaryValue, { color: netIncome >= 0 ? colors.status.success : colors.status.error }]}>
          {netIncome.toFixed(2)} MZN
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text.primary, marginTop: spacing.lg }]}>Créditos Existentes</Text>
      <View style={styles.switchRow}>
        <Text style={[styles.label, { color: colors.text.primary, fontSize: 16 }]}>
          Possui atualmente algum empréstimo ou crédito?
        </Text>
        <Switch
          value={formData.hasExistingCredit}
          onValueChange={(val) => updateData({ hasExistingCredit: val })}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
        />
      </View>

      {formData.hasExistingCredit && (
        <View style={styles.creditSection}>
          <PremiumInput label="Instituição" placeholder="Nome do Banco/Microcrédito" value={formData.creditInstitution} onChangeText={(text) => updateData({ creditInstitution: text })} />
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: spacing.xs }}>
              <PremiumInput label="Saldo em Dívida" placeholder="0.00" keyboardType="numeric" value={formData.creditBalance} onChangeText={(text) => updateData({ creditBalance: text })} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.xs }}>
              <PremiumInput label="Prestação Mensal" placeholder="0.00" keyboardType="numeric" value={formData.creditInstallment} onChangeText={(text) => updateData({ creditInstallment: text })} />
            </View>
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.lg,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
  },
  summaryBox: {
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryLabel: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xxl,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
    paddingRight: spacing.sm,
  },
  label: {
    fontFamily: typography.family.medium,
    flex: 1,
  },
  creditSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
});
