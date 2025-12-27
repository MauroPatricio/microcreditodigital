import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB conectado com sucesso!');
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🖥️  Host: ${conn.connection.host}`);

    return conn;
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:');
    console.error(`   Mensagem: ${error.message}`);

    if (error.message.includes('ENOTFOUND')) {
      console.error('   💡 Verifique se o URI do MongoDB está correto no arquivo .env');
    } else if (error.message.includes('authentication failed')) {
      console.error('   💡 Verifique as credenciais do MongoDB (usuário/senha)');
    } else if (error.message.includes('IP') || error.message.includes('whitelist')) {
      console.error('   💡 Adicione o IP do servidor à whitelist no MongoDB Atlas');
    }

    // Não encerra o processo, permite que o servidor continue rodando
    console.log('⚠️  Servidor continuará rodando sem conexão ao MongoDB');
    return null;
  }
};

// Eventos de conexão
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB desconectado');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Erro no MongoDB:', err.message);
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔌 Conexão com MongoDB fechada');
  process.exit(0);
});

export default connectDB;
