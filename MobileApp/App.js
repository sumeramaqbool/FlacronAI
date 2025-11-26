import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==================== CONFIGURATION ====================

// Web app matching colors
const COLORS = {
  primary: '#FF7C08',           // Orange from web app
  primaryDark: '#ff9533',
  secondary: '#1f2937',         // Dark gray
  background: '#f9fafb',        // Light gray background
  surface: '#ffffff',
  text: '#1f2937',              // Dark text
  textSecondary: '#6b7280',     // Gray text
  textMuted: '#9ca3af',
  border: '#e5e7eb',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
};

// ⚠️ IMPORTANT: Set this to your LOCAL backend when testing locally!
// Option 1: Local backend (when running 'node server.js' on your computer)
const API_URL = 'https://flacronai.onrender.com/api'; // ✅ YOUR LOCAL BACKEND

// Option 2: Production backend (deployed on Render)
// const API_URL = 'https://flacronai.onrender.com/api'; // ❌ Doesn't have new endpoints

// 🔍 YOUR IP ADDRESS: 192.168.18.158
// Make sure your backend is running: cd backend && node server.js

// ==================== MAIN APP ====================

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Log API URL on app start
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║           FLACRONAI MOBILE APP STARTED               ║');
  console.log('╠═══════════════════════════════════════════════════════╣');
  console.log('║  API URL:', API_URL);
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  // Helper function to format tier name for display
  const formatTierName = (tier) => {
    if (!tier) return 'Free';
    const tierMap = {
      'starter': 'Starter',
      'professional': 'Pro',
      'agency': 'Agency',
      'enterprise': 'Enterprise'
    };
    return tierMap[tier.toLowerCase()] || tier;
  };

  // Report generation state
  const [formData, setFormData] = useState({
    claimNumber: '',
    insuredName: '',
    lossDate: '',
    lossType: 'Fire',
    reportType: 'Preliminary',
    propertyAddress: '',
    propertyDetails: '',
    lossDescription: '',
    damages: '',
    recommendations: '',
  });
  const [photos, setPhotos] = useState([]);
  const [generatedReport, setGeneratedReport] = useState('');
  const [generating, setGenerating] = useState(false);

  // My Reports state
  const [myReports, setMyReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Usage stats
  const [usageStats, setUsageStats] = useState(null);

  // Request permissions
  useEffect(() => {
    (async () => {
      await ImagePicker.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, []);

  // Check for saved session on app load
  useEffect(() => {
    checkSavedSession();
  }, []);

  const checkSavedSession = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('authToken');
      const savedUser = await AsyncStorage.getItem('userData');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Fetch fresh data
        fetchUsageStats(savedToken);
        fetchReports(savedToken);
      }
    } catch (error) {
      console.log('Session restore error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch usage stats from backend
  const fetchUsageStats = async (authToken = token) => {
    if (!authToken) return;

    try {
      const response = await fetch(`${API_URL}/users/usage`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (data.success) {
        setUsageStats(data.usage);
      }
    } catch (error) {
      console.log('Error fetching usage:', error);
    }
  };

  // Fetch reports from backend
  const fetchReports = async (authToken = token) => {
    if (!authToken) return;

    setLoadingReports(true);
    try {
      const response = await fetch(`${API_URL}/reports/my-reports`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (data.success) {
        setMyReports(data.reports || []);
      }
    } catch (error) {
      console.log('Error fetching reports:', error);
    } finally {
      setLoadingReports(false);
      setRefreshing(false);
    }
  };

  const handleRegister = async () => {
    if (!displayName || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    console.log('\n📝 REGISTRATION ATTEMPT:');
    console.log('   Name:', displayName);
    console.log('   Email:', email);
    console.log('   API URL:', `${API_URL}/auth/register`);

    setLoading(true);
    try {
      const requestBody = { email, password, displayName };
      console.log('   Request Body:', JSON.stringify(requestBody, null, 2));
      console.log('   Sending request...');

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('   Response Status:', response.status);
      console.log('   Response OK:', response.ok);

      const responseText = await response.text();
      console.log('   Response Text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('   Parsed Data:', JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.error('   JSON Parse Error:', parseError);
        Alert.alert('Error', `Server response is not JSON: ${responseText.substring(0, 100)}`);
        setLoading(false);
        return;
      }

      if (data.success) {
        console.log('   ✅ Registration successful!');
        Alert.alert(
          'Success',
          'Account created successfully! For demo purposes, you can login now without email verification.',
          [{ text: 'OK', onPress: () => {
            setIsLogin(true);
            setEmail('');
            setPassword('');
            setDisplayName('');
          }}]
        );
      } else {
        console.error('   ❌ Registration failed:', data.error);
        Alert.alert('Registration Error', data.error);
      }
    } catch (error) {
      console.error('   ❌ Network Error:', error);
      console.error('   Error details:', JSON.stringify(error, null, 2));
      Alert.alert('Registration Error', `Network error: ${error.message}\n\nCheck if backend is running!`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    console.log('\n🔐 LOGIN ATTEMPT:');
    console.log('   Email:', email);
    console.log('   API URL:', `${API_URL}/auth/login`);

    setLoading(true);
    try {
      const requestBody = {
        email,
        password,
        skipEmailVerification: true
      };

      console.log('   Request Body:', JSON.stringify(requestBody, null, 2));
      console.log('   Sending request...');

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('   Response Status:', response.status);
      console.log('   Response OK:', response.ok);

      const responseText = await response.text();
      console.log('   Response Text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('   Parsed Data:', JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.error('   JSON Parse Error:', parseError);
        Alert.alert('Error', `Server response is not JSON: ${responseText.substring(0, 100)}`);
        setLoading(false);
        return;
      }

      if (data.success) {
        console.log('   ✅ Login successful!');
        console.log('   Token received:', data.token ? 'YES' : 'NO');

        // Save token and user data
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));

        setToken(data.token);
        setUser(data.user);

        // Fetch user data
        fetchUsageStats(data.token);
        fetchReports(data.token);

        setEmail('');
        setPassword('');
      } else {
        console.error('   ❌ Login failed:', data.error);
        Alert.alert('Login Error', data.error);
      }
    } catch (error) {
      console.error('   ❌ Network Error:', error);
      console.error('   Error details:', JSON.stringify(error, null, 2));
      Alert.alert('Login Error', `Network error: ${error.message}\n\nCheck if backend is running on port 3000`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear local storage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');

      // Clear state
      setUser(null);
      setToken(null);
      setMyReports([]);
      setUsageStats(null);
      setCurrentPage('dashboard');

      Alert.alert('Success', 'Logged out successfully');
    } catch (error) {
      Alert.alert('Error', 'Logout failed');
    }
  };

  const handleDownloadReport = async (report) => {
    if (!report) return;

    try {
      console.log('📥 DOWNLOAD REPORT:');
      console.log('   Claim Number:', report.claimNumber);

      // Create report content
      const reportContent = `
╔══════════════════════════════════════════════════════════════╗
║                   FLACRONAI INSPECTION REPORT                ║
╚══════════════════════════════════════════════════════════════╝

CLAIM INFORMATION
════════════════════════════════════════════════════════════════
Claim Number:     ${report.claimNumber}
Insured Name:     ${report.insuredName}
Loss Type:        ${report.lossType}
Generated Date:   ${new Date(report.createdAt).toLocaleString()}

REPORT CONTENT
════════════════════════════════════════════════════════════════

${report.content}

════════════════════════════════════════════════════════════════
Generated by FlacronAI - AI-Powered Inspection Reports
════════════════════════════════════════════════════════════════
      `.trim();

      // Create filename
      const filename = `FlacronAI_${report.claimNumber.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.txt`;
      const fileUri = FileSystem.documentDirectory + filename;

      // Write file
      await FileSystem.writeAsStringAsync(fileUri, reportContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      console.log('   ✅ File created:', fileUri);

      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();

      if (isSharingAvailable) {
        // Share/Download the file
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Download Report',
          UTI: 'public.plain-text',
        });

        console.log('   ✅ Download initiated');
        Alert.alert('Success', `Report downloaded: ${filename}`);
      } else {
        Alert.alert('Success', `Report saved to: ${fileUri}`);
      }

    } catch (error) {
      console.error('   ❌ Download Error:', error);
      Alert.alert('Download Error', `Failed to download report: ${error.message}`);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotos([...photos, ...result.assets]);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0]]);
    }
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleGenerateReport = async () => {
    if (!formData.claimNumber || !formData.insuredName || !formData.lossType) {
      Alert.alert('Error', 'Please fill in required fields: Claim Number, Insured Name, and Loss Type');
      return;
    }

    setGenerating(true);
    setGeneratedReport('');

    try {
      const response = await fetch(`${API_URL}/reports/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedReport(data.report.content);
        Alert.alert('Success', 'Report generated successfully!');

        // Refresh data
        fetchUsageStats();
        fetchReports();

        // Reset form
        setFormData({
          claimNumber: '',
          insuredName: '',
          lossDate: '',
          lossType: 'Fire',
          reportType: 'Preliminary',
          propertyAddress: '',
          propertyDetails: '',
          lossDescription: '',
          damages: '',
          recommendations: '',
        });
        setPhotos([]);
      } else {
        Alert.alert('Error', data.error || 'Failed to generate report');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setGenerating(false);
    }
  };

  const updateFormField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsageStats();
    fetchReports();
  };

  // Loading Screen
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading FlacronAI...</Text>
      </View>
    );
  }

  // Auth Screen (Login/Register)
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ScrollView contentContainerStyle={styles.authContent}>
          <View style={styles.authHeader}>
            <View style={styles.logoContainer}>
              <Ionicons name="shield-checkmark" size={60} color={COLORS.primary} />
            </View>
            <Text style={styles.authTitle}>FlacronAI</Text>
            <Text style={styles.authSubtitle}>
              {isLogin ? 'Welcome back!' : 'Create your account'}
            </Text>
          </View>

          <View style={styles.authForm}>
            {!isLogin && (
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                placeholderTextColor={COLORS.textMuted}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={COLORS.textMuted}
            />

            <TextInput
              style={styles.input}
              placeholder="Password (min 6 characters)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={COLORS.textMuted}
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={isLogin ? handleLogin : handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isLogin ? 'Login' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.switchText}>
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Main App - Dashboard
  const renderDashboard = () => (
    <ScrollView
      style={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
        />
      }
    >
      <View style={styles.welcomeSection}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.displayName}</Text>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>Usage Statistics</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="document-text" size={32} color={COLORS.primary} />
            <Text style={styles.statValue}>{usageStats?.periodUsage || 0}</Text>
            <Text style={styles.statLabel}>Used</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
            <Text style={styles.statValue}>{usageStats?.limit || 50}</Text>
            <Text style={styles.statLabel}>Limit</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="ribbon" size={32} color={COLORS.info} />
            <Text style={styles.statValue}>{formatTierName(usageStats?.tier)}</Text>
            <Text style={styles.statLabel}>Tier</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => setCurrentPage('generate')}
        >
          <Ionicons name="add-circle" size={40} color={COLORS.primary} />
          <Text style={styles.actionText}>Generate Report</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => setCurrentPage('reports')}
        >
          <Ionicons name="folder-open" size={40} color={COLORS.success} />
          <Text style={styles.actionText}>My Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => {
            // Auto-fill demo data
            setFormData({
              claimNumber: 'CLM-2024-001',
              insuredName: 'John Smith',
              lossDate: '2024-01-15',
              lossType: 'Fire',
              reportType: 'Preliminary',
              propertyAddress: '123 Main Street, City',
              propertyDetails: 'Single family residence, 2000 sq ft',
              lossDescription: 'Kitchen fire caused by electrical fault',
              damages: 'Smoke and fire damage to kitchen and adjacent rooms',
              recommendations: 'Replace damaged appliances and repair affected walls',
            });
            setCurrentPage('generate');
          }}
        >
          <Ionicons name="flash" size={40} color={COLORS.warning} />
          <Text style={styles.actionText}>Quick Demo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => setCurrentPage('profile')}
        >
          <Ionicons name="person-circle" size={40} color={COLORS.info} />
          <Text style={styles.actionText}>Profile</Text>
        </TouchableOpacity>
      </View>

      {myReports.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Reports</Text>
          {myReports.slice(0, 3).map((report, index) => (
            <TouchableOpacity
              key={report.reportId || index}
              style={styles.reportListItem}
              onPress={() => {
                setSelectedReport(report);
                setCurrentPage('reports');
              }}
            >
              <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
              <View style={styles.reportInfo}>
                <Text style={styles.reportTitle}>{report.claimNumber}</Text>
                <Text style={styles.reportSubtitle}>{report.insuredName}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {myReports.length === 0 && !loadingReports && (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyStateText}>No reports yet</Text>
          <Text style={styles.emptyStateSubtext}>Tap "Generate Report" to create your first report!</Text>
        </View>
      )}
    </ScrollView>
  );

  // Generate Report Page
  const renderGenerate = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.pageTitle}>Generate New Report</Text>

      <View style={styles.formSection}>
        <Text style={styles.sectionLabel}>Claim Information</Text>

        <Text style={styles.inputLabel}>Claim Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter claim number"
          value={formData.claimNumber}
          onChangeText={(value) => updateFormField('claimNumber', value)}
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.inputLabel}>Insured Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter insured name"
          value={formData.insuredName}
          onChangeText={(value) => updateFormField('insuredName', value)}
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.inputLabel}>Loss Date</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={formData.lossDate}
          onChangeText={(value) => updateFormField('lossDate', value)}
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.inputLabel}>Loss Type *</Text>
        <View style={styles.pickerContainer}>
          {['Fire', 'Water', 'Wind', 'Hail', 'Theft', 'Vandalism', 'Other'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.pickerOption,
                formData.lossType === type && styles.pickerOptionSelected
              ]}
              onPress={() => updateFormField('lossType', type)}
            >
              <Text style={[
                styles.pickerOptionText,
                formData.lossType === type && styles.pickerOptionTextSelected
              ]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Property Details</Text>

        <Text style={styles.inputLabel}>Property Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter property address"
          value={formData.propertyAddress}
          onChangeText={(value) => updateFormField('propertyAddress', value)}
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.inputLabel}>Property Details</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter property details"
          value={formData.propertyDetails}
          onChangeText={(value) => updateFormField('propertyDetails', value)}
          multiline
          numberOfLines={4}
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.sectionLabel}>Loss Information</Text>

        <Text style={styles.inputLabel}>Loss Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe the loss"
          value={formData.lossDescription}
          onChangeText={(value) => updateFormField('lossDescription', value)}
          multiline
          numberOfLines={4}
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.inputLabel}>Damages</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe damages"
          value={formData.damages}
          onChangeText={(value) => updateFormField('damages', value)}
          multiline
          numberOfLines={4}
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.inputLabel}>Recommendations</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter recommendations"
          value={formData.recommendations}
          onChangeText={(value) => updateFormField('recommendations', value)}
          multiline
          numberOfLines={4}
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.sectionLabel}>Photos</Text>
        <View style={styles.photoButtons}>
          <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
            <Ionicons name="images-outline" size={24} color={COLORS.primary} />
            <Text style={styles.photoButtonText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
            <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
            <Text style={styles.photoButtonText}>Camera</Text>
          </TouchableOpacity>
        </View>

        {photos.length > 0 && (
          <View style={styles.photoGrid}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoItem}>
                <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                <TouchableOpacity
                  style={styles.photoRemove}
                  onPress={() => removePhoto(index)}
                >
                  <Ionicons name="close-circle" size={24} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGenerateReport}
          disabled={generating}
        >
          {generating ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color="#ffffff" />
              <Text style={styles.generateButtonText}>Generating...</Text>
            </View>
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color="#ffffff" />
              <Text style={styles.generateButtonText}>Generate Report with AI</Text>
            </>
          )}
        </TouchableOpacity>

        {generatedReport && (
          <View style={styles.reportPreview}>
            <Text style={styles.reportPreviewTitle}>Generated Report</Text>
            <ScrollView style={styles.reportPreviewContent} nestedScrollEnabled>
              <Text style={styles.reportText}>{generatedReport}</Text>
            </ScrollView>
          </View>
        )}
      </View>
    </ScrollView>
  );

  // My Reports Page
  const renderReports = () => (
    <ScrollView
      style={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
        />
      }
    >
      <View style={styles.pageTitleContainer}>
        <Text style={styles.pageTitle}>My Reports</Text>
        {!loadingReports && myReports.length > 0 && (
          <View style={styles.reportCountBadge}>
            <Text style={styles.reportCountText}>{myReports.length} {myReports.length === 1 ? 'Report' : 'Reports'}</Text>
          </View>
        )}
      </View>

      {loadingReports ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : myReports.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyStateText}>No reports yet</Text>
          <Text style={styles.emptyStateSubtext}>Generate your first report to get started!</Text>
        </View>
      ) : (
        <View>
          {myReports.map((report, index) => (
            <TouchableOpacity
              key={report.reportId || index}
              style={styles.reportCard}
              onPress={() => setSelectedReport(report)}
            >
              <View style={styles.reportCardHeader}>
                <View>
                  <Text style={styles.reportCardTitle}>{report.claimNumber}</Text>
                  <Text style={styles.reportCardSubtitle}>{report.insuredName}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={COLORS.textMuted} />
              </View>
              <View style={styles.reportCardMeta}>
                <View style={styles.reportCardMetaItem}>
                  <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.reportCardMetaText}>
                    {new Date(report.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.reportCardMetaItem}>
                  <Ionicons name="flame-outline" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.reportCardMetaText}>{report.lossType}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Report Detail Modal */}
      <Modal
        visible={selectedReport !== null}
        animationType="slide"
        onRequestClose={() => setSelectedReport(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Report Details</Text>
            <View style={styles.modalHeaderActions}>
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => handleDownloadReport(selectedReport)}
              >
                <Ionicons name="download-outline" size={24} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSelectedReport(null)}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView style={styles.modalContent}>
            {selectedReport && (
              <>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Claim Number</Text>
                  <Text style={styles.modalValue}>{selectedReport.claimNumber}</Text>
                </View>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Insured Name</Text>
                  <Text style={styles.modalValue}>{selectedReport.insuredName}</Text>
                </View>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Loss Type</Text>
                  <Text style={styles.modalValue}>{selectedReport.lossType}</Text>
                </View>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Generated Report</Text>
                  <Text style={styles.modalValueContent}>{selectedReport.content}</Text>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );

  // Profile Page
  const renderProfile = () => (
    <ScrollView style={styles.content}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={50} color={COLORS.primary} />
        </View>
        <Text style={styles.profileName}>{user?.displayName}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Information</Text>
        <View style={styles.infoRow}>
          <Ionicons name="mail" size={20} color={COLORS.text} />
          <Text style={styles.infoText}>{user?.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="ribbon" size={20} color={COLORS.success} />
          <Text style={styles.infoText}>Tier: {formatTierName(usageStats?.tier)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={20} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>
            Joined: {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>FlacronAI</Text>
        <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
      </View>

      {/* Content */}
      {currentPage === 'dashboard' && renderDashboard()}
      {currentPage === 'generate' && renderGenerate()}
      {currentPage === 'reports' && renderReports()}
      {currentPage === 'profile' && renderProfile()}

      {/* Bottom Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setCurrentPage('dashboard')}
        >
          <Ionicons
            name={currentPage === 'dashboard' ? 'home' : 'home-outline'}
            size={24}
            color={currentPage === 'dashboard' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[
            styles.tabLabel,
            currentPage === 'dashboard' && styles.tabLabelActive
          ]}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setCurrentPage('generate')}
        >
          <Ionicons
            name={currentPage === 'generate' ? 'add-circle' : 'add-circle-outline'}
            size={24}
            color={currentPage === 'generate' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[
            styles.tabLabel,
            currentPage === 'generate' && styles.tabLabelActive
          ]}>Generate</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setCurrentPage('reports')}
        >
          <Ionicons
            name={currentPage === 'reports' ? 'folder' : 'folder-outline'}
            size={24}
            color={currentPage === 'reports' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[
            styles.tabLabel,
            currentPage === 'reports' && styles.tabLabelActive
          ]}>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setCurrentPage('profile')}
        >
          <Ionicons
            name={currentPage === 'profile' ? 'person' : 'person-outline'}
            size={24}
            color={currentPage === 'profile' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[
            styles.tabLabel,
            currentPage === 'profile' && styles.tabLabelActive
          ]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  logo: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Auth Styles
  authContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff5ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  authTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  authForm: {
    width: '100%',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    color: COLORS.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  switchText: {
    textAlign: 'center',
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },

  // Dashboard Styles
  welcomeSection: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  greeting: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionCard: {
    backgroundColor: COLORS.surface,
    width: '47%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  actionText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  recentSection: {
    marginTop: 16,
    marginBottom: 20,
  },
  reportListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reportInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  reportSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Generate Page Styles
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    padding: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pageTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  reportCountBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  reportCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  formSection: {
    padding: 16,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  pickerOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pickerOptionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  pickerOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  photoButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  photoItem: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  photoRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  generateButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  reportPreview: {
    marginTop: 24,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reportPreviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  reportPreviewContent: {
    maxHeight: 300,
  },
  reportText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },

  // Reports Page Styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  reportCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  reportCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  reportCardSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  reportCardMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  reportCardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportCardMetaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  downloadButton: {
    padding: 8,
    backgroundColor: '#fff5ed',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  modalValue: {
    fontSize: 16,
    color: COLORS.text,
  },
  modalValueContent: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Profile Styles
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff5ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 20,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },

  // Tab Bar Styles
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 8,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
