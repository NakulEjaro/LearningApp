import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  Image,
  TextInput,
  useWindowDimensions,
  FlatList,
  ScrollView,
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  UIManager,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CategoryListView from './CategoryListView';
import PopulerCourseListView from './PopulerCourseListView';
import MyPressable from '../components/MyPressable';
import { CATEGORY_LIST, POPULAR_COURSE_LIST } from './model/category';
import { AppImages } from '../assets';
import Config from '../Config';

interface CategoryBtn {
  text: string;
  selectedCat: string;
  onPress: () => void;
  icon?: string;
}

interface Category {
  id: string;
  text: string;
  color: string;
  description: string;
  icon?: string;
}

const CATEGORIES: Category[] = [
  {
    id: 'primary',
    text: 'Primary',
    color: '#007bff',
    description:
      'Find the messages that matter most in Primary and organise everything else.',
    icon: 'person',
  },
  {
    id: 'transactions',
    text: 'Transactions',
    color: '#28a745',
    description:
      'Keep track of your orders, including delivery and delivery notices, bundled by sender.',
    icon: 'shopping-cart',
  },
  {
    id: 'updates',
    text: 'Updates',
    color: '#6f42c1',
    description: 'No Mail',
    icon: 'chat',
  },
  {
    id: 'promotions',
    text: 'Promotions',
    color: '#e83e8c',
    description:
      "Special Offers, Deals and More - See what's new from businesses and organisations you recognise.",
    icon: 'campaign',
  },
  {
    id: 'allmail',
    text: 'All Mail',
    color: '#6c757d',
    description:
      'See All Messages - Show messages from every category listed together for a quick glance at your inbox.',
    icon: 'mail',
  },
];

// Enable LayoutAnimation for Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CategoryButton = ({ text, selectedCat, onPress, icon }: CategoryBtn) => {
  const category = CATEGORIES.find(cat => cat.text === text);
  const isSelected = selectedCat === text;
  const color = category?.color || '#999999';

  // Animation for tab selection
  const scaleAnim = useRef(new Animated.Value(isSelected ? 1 : 0.95)).current;
  const opacityAnim = useRef(new Animated.Value(isSelected ? 1 : 0.7)).current;

  useEffect(() => {
    // Apply spring animation when tab is selected
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isSelected ? 1 : 0.95,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: isSelected ? 1 : 0.7,
        duration: 550,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isSelected]);

  // Direct pressable handler with debugging
  const handlePress = () => {
    console.log(`Category pressed: ${text}`);

    // Configure custom spring animation on tab press
    LayoutAnimation.configureNext({
      duration: 550,
      create: { type: 'spring', property: 'scaleXY', springDamping: 0.7 },
      update: { type: 'spring', springDamping: 0.7 },
      delete: { type: 'linear', property: 'opacity' },
    });

    // Call the provided onPress function
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.9 : 1,
        },
        styles.tabButton,
      ]}
      android_ripple={{ color: 'lightgrey', borderless: true }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      testID={`category-button-${text}`}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
          paddingHorizontal: 1,
          marginVertical: 10,
        }}
      >
        {isSelected ? (
          <View
            style={{
              height: 48,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 24,
              backgroundColor: color,
            }}
          >
            {category?.icon && (
              <Icon
                name={category.icon}
                size={20}
                color="white"
                style={{ marginRight: 8 }}
              />
            )}
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'WorkSans-SemiBold',
                color: 'white',
                textAlign: 'center',
              }}
            >
              {text}
            </Text>
          </View>
        ) : (
          <View
            style={{
              height: 48,
              borderRadius: 24,
              paddingVertical: 12,
              paddingHorizontal: 20,
              backgroundColor: '#2A2A2A',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {category?.icon && (
              <Icon name={category.icon} size={22} color="#ffffff" />
            )}
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};

const HomeDesignCourse: React.FC = () => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  // Reference to the ScrollView for programmatic scrolling
  const tabScrollViewRef = useRef<ScrollView>(null);

  // State for keeping track of category positions for auto-scrolling
  const [scrollViewWidth, setScrollViewWidth] = useState(0);
  const [categoryLayout, setCategoryLayout] = useState<
    Record<string, { x: number; width: number }>
  >({});

  // Animation values for the category description banner
  const bannerHeight = useRef(new Animated.Value(100)).current;
  const bannerOpacity = useRef(new Animated.Value(1)).current;
  const [showBanner, setShowBanner] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].text);

  const paddingTop = Config.isIos
    ? Math.max(insets.top, 20)
    : StatusBar.currentHeight;

  // Function to measure and store the position of each category tab
  const measureCategoryLayout = useCallback(
    (category: string, x: number, width: number) => {
      console.log(`Measuring category: ${category}, x: ${x}, width: ${width}`);
      setCategoryLayout(prev => {
        const newLayout = {
          ...prev,
          [category]: { x, width },
        };
        console.log('New category layout:', newLayout);
        return newLayout;
      });
    },
    [],
  );

  // Handle category change with animations
  const handleCategoryChange = useCallback(
    (category: string) => {
      setSelectedCategory(category);

      // Auto-scroll to center the selected tab
      if (categoryLayout[category]) {
        const { x, width } = categoryLayout[category];
        const scrollOffset = x - scrollViewWidth / 2 + width / 2;
        tabScrollViewRef.current?.scrollTo({
          x: Math.max(0, scrollOffset),
          animated: true,
        });
      }

      // Show the description banner when changing categories
      if (!showBanner) {
        setShowBanner(true);
        Animated.parallel([
          Animated.timing(bannerHeight, {
            toValue: 100,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(bannerOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: false,
          }),
        ]).start();
      }
    },
    [categoryLayout, scrollViewWidth, showBanner, bannerHeight, bannerOpacity],
  );

  // Function to close the description banner
  const closeBanner = useCallback(() => {
    Animated.parallel([
      Animated.timing(bannerHeight, {
        toValue: 0,
        duration: 400,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(bannerOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setShowBanner(false);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    });
  }, [bannerHeight, bannerOpacity]);

  // Get the selected category object
  const selectedCategoryObj = CATEGORIES.find(
    cat => cat.text === selectedCategory,
  );

  const renderScrollableHeader = useCallback(
    () => (
      <>
        <View style={styles.searchInputMainContainer}>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#B9BABC"
            />
            <Icon name="search" color="#B9BABC" size={24} />
          </View>
        </View>

        <View
          style={styles.categoryTabsContainer}
          onLayout={(e: any) => setScrollViewWidth(e.nativeEvent.layout.width)}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContainer}
            ref={tabScrollViewRef}
            onContentSizeChange={() => {
              // Auto-scroll to center the selected tab when category changes
              if (categoryLayout[selectedCategory]) {
                const { x, width } = categoryLayout[selectedCategory];
                const scrollOffset = x - scrollViewWidth / 2 + width / 2;
                tabScrollViewRef.current?.scrollTo({
                  x: Math.max(0, scrollOffset),
                  animated: true,
                });
              }
            }}
          >
            {CATEGORIES.map((category, index) => {
              // Measure position for each tab for auto-scrolling
              const onLayout = (e: any) => {
                const { x, width } = e.nativeEvent.layout;
                measureCategoryLayout(category.text, x, width);
              };

              return (
                <CategoryButton
                  key={category.id}
                  text={category.text}
                  selectedCat={selectedCategory}
                  onPress={() => {
                    console.log(`Category selected: ${category.text}`);
                    handleCategoryChange(category.text);
                    // Force measure after selection
                    setTimeout(() => {
                      if (categoryLayout[category.text]) {
                        const { x, width } = categoryLayout[category.text];
                        const scrollOffset =
                          x - scrollViewWidth / 2 + width / 2;
                        tabScrollViewRef.current?.scrollTo({
                          x: Math.max(0, scrollOffset),
                          animated: true,
                        });
                      }
                    }, 0);
                  }}
                  icon={category.icon}
                />
              );
            })}
          </ScrollView>
        </View>

        {/* Description banner */}
        {showBanner && selectedCategoryObj && (
          <Animated.View
            style={[
              styles.descriptionBanner,
              {
                backgroundColor: selectedCategoryObj.color + '15',
                height: bannerHeight,
                opacity: bannerOpacity,
              },
            ]}
          >
            <Text
              style={[
                styles.descriptionText,
                { color: selectedCategoryObj.color },
              ]}
            >
              {selectedCategoryObj.description}
            </Text>
            <MyPressable
              touchOpacity={0.6}
              onPress={closeBanner}
              style={styles.closeBannerButton}
            >
              <Text
                style={[
                  styles.closeBannerText,
                  { color: selectedCategoryObj.color },
                ]}
              >
                ×
              </Text>
            </MyPressable>
          </Animated.View>
        )}

        <FlatList
          contentContainerStyle={{ padding: 16 }}
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORY_LIST}
          renderItem={data => (
            <CategoryListView
              {...{ data }}
              onScreenClicked={() => navigation.navigate('CourseInfo')}
            />
          )}
          keyExtractor={item => item.id.toString()}
        />
        <Text style={styles.sectionHeaderText}>Popular Course</Text>
      </>
    ),
    [
      categoryLayout,
      scrollViewWidth,
      selectedCategory,
      selectedCategoryObj,
      showBanner,
      bannerHeight,
      bannerOpacity,
      closeBanner,
      measureCategoryLayout,
      handleCategoryChange,
      navigation,
    ],
  );

  return (
    <View style={{ flex: 1, backgroundColor: 'white', paddingTop }}>
      <StatusBar backgroundColor="white" barStyle="dark-content" />
      <View style={styles.header}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={styles.headerTextNormal}>Choose your</Text>
          <Text style={styles.headerTextBold}>Design Course</Text>
        </View>
        <Image
          style={{ width: 60, height: 60 }}
          source={AppImages.design_header_image}
        />
      </View>

      <FlatList
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 16 + insets.bottom,
        }}
        columnWrapperStyle={{ paddingHorizontal: 8 }}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        data={POPULAR_COURSE_LIST}
        ListHeaderComponent={renderScrollableHeader}
        ItemSeparatorComponent={() => <View style={{ height: 32 }} />}
        renderItem={data => (
          <PopulerCourseListView
            {...{ data }}
            onScreenClicked={() => navigation.navigate('CourseInfo')}
          />
        )}
        keyExtractor={item => item.id.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  searchInputMainContainer: {
    marginTop: 8,
    marginLeft: 18,
    height: 64,
  },
  searchInputContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFB',
    marginVertical: 8,
    borderRadius: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'WorkSans-SemiBold',
    color: 'dodgerblue',
  },
  sectionHeaderText: {
    color: 'black',
    fontSize: 22,
    fontFamily: 'WorkSans-SemiBold',
    letterSpacing: 0.27,
    paddingTop: 8,
    paddingLeft: 18,
    paddingRight: 16,
    marginBottom: 16,
  },
  categoryRowContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  categoryTabsContainer: {
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabScrollContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  tabButton: {
    paddingHorizontal: 5,
    marginVertical: 10,
  },
  tabButtonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  selectedTabContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unselectedTabContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonText: {
    fontSize: 16,
    fontFamily: 'WorkSans-SemiBold',
    marginLeft: 8,
    textAlign: 'center',
  },
  tabIcon: {
    // No margin needed - adjusted in selected state with text spacing
  },
  descriptionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingRight: 40,
    marginBottom: 8,
    overflow: 'hidden',
  },
  descriptionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'WorkSans-Regular',
  },
  closeBannerButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBannerText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 18,
  },
  headerTextNormal: {
    color: 'grey',
    fontFamily: 'WorkSans-Regular',
    letterSpacing: 0.2,
  },
  headerTextBold: {
    color: 'black',
    fontSize: 22,
    fontFamily: 'WorkSans-Bold',
    letterSpacing: 0.2,
  },
});

// No longer needed as we've moved to inline styling with the new design

export default HomeDesignCourse;
