import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, type ThemeColors } from "../theme";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const FACTS: { icon: IoniconsName; text: string; source: string }[] = [
  {
    icon: "happy-outline",
    text: "Babies can recognize their mother's voice from inside the womb.",
    source: "DeCasper & Fifer, Science, 1980",
  },
  {
    icon: "fitness-outline",
    text: "The uterus is the strongest muscle in the human body by weight.",
    source: "Cunningham et al., Williams Obstetrics, 26th Ed.",
  },
  {
    icon: "water-outline",
    text: "Contractions work like ocean waves \u2014 they build, peak, and recede.",
    source: "ACOG Patient Education",
  },
  {
    icon: "eye-outline",
    text: "Newborns can see about 8\u201312 inches \u2014 just far enough to see your face while being held.",
    source: "Slater & Johnson, Infant Vision, Oxford, 1998",
  },
  {
    icon: "heart-outline",
    text: "A baby's heart beats about 120\u2013160 times per minute \u2014 roughly twice as fast as yours.",
    source: "AAP NRP Guidelines",
  },
  {
    icon: "body-outline",
    text: "Babies are born with about 300 bones. Some fuse together, leaving adults with just 206.",
    source: "Gray's Anatomy, 42nd Ed.",
  },
  {
    icon: "flower-outline",
    text: "Newborns can recognize their mother's scent right after birth.",
    source: "Macfarlane, Ciba Foundation Symposium, 1975",
  },
  {
    icon: "cloudy-outline",
    text: "Babies practice breathing in the womb by inhaling and exhaling amniotic fluid.",
    source: "Moore et al., The Developing Human, 11th Ed.",
  },
  {
    icon: "moon-outline",
    text: "Most babies are born between midnight and 6 AM. Night owls from the start!",
    source: "Linde et al., Annals of Epidemiology, 2001",
  },
  {
    icon: "musical-notes-outline",
    text: "Babies can hear and remember music played during the third trimester.",
    source: "Partanen et al., PLOS ONE, 2013",
  },
  {
    icon: "happy-outline",
    text: "Laughing during labor is associated with endorphin release \u2014 the body\u2019s natural response to joy.",
    source: "Dunbar et al., Proc. Royal Society B, 2012",
  },
  {
    icon: "bulb-outline",
    text: "A newborn's brain is about 25% of its adult size and doubles in the first year.",
    source: "Knickmeyer et al., J. Neuroscience, 2008",
  },
  {
    icon: "sparkles-outline",
    text: 'The hormone oxytocin that drives contractions is the same "love hormone" released during hugs.',
    source: "Uvnas-Moberg, The Oxytocin Factor, 2003",
  },
  {
    icon: "finger-print-outline",
    text: "Every baby is born with unique fingerprints \u2014 they develop around 3 months in the womb.",
    source: "Kucken & Newell, J. Theoretical Biology, 2005",
  },
  {
    icon: "leaf-outline",
    text: "Babies can taste what their mother eats! Flavors pass through to amniotic fluid.",
    source: "Mennella et al., Pediatrics, 2001",
  },
  {
    icon: "bed-outline",
    text: "Newborns sleep 14\u201317 hours a day, but rarely more than 2\u20133 hours at a stretch.",
    source: "Hirshkowitz et al., Sleep Health, 2015",
  },
  {
    icon: "eye-outline",
    text: "Most babies are born with blue or grey eyes. Permanent color can take up to a year.",
    source: "Sturm & Larsson, Experimental Dermatology, 2009",
  },
  {
    icon: "hand-left-outline",
    text: "A baby's grip is strong enough to support their own body weight!",
    source: "AAP Pediatrics, Palmar Reflex",
  },
  {
    icon: "leaf-outline",
    text: "Deep, slow breathing during contractions is associated with increased oxygen flow.",
    source: "Lothian, J. Perinatal Education, 2011",
  },
  {
    icon: "globe-outline",
    text: "About 385,000 babies are born every day worldwide.",
    source: "UNICEF, State of the World's Children, 2023",
  },
  {
    icon: "happy-outline",
    text: "Baby teeth start forming in the womb \u2014 they're hidden under the gums at birth.",
    source: "AAPD Perinatal Oral Health Guideline",
  },
  {
    icon: "code-outline",
    text: "Your baby has their own unique DNA from the moment of conception.",
    source: "Alberts et al., Molecular Biology of the Cell, 7th Ed.",
  },
  {
    icon: "moon-outline",
    text: "Between contractions, the body naturally shifts to a resting state \u2014 even briefly.",
    source: "Simkin, The Birth Partner, 5th Ed.",
  },
  {
    icon: "balloon-outline",
    text: "Babies can hiccup in the womb! Those rhythmic bumps you felt were hiccups.",
    source: "Whitehead et al., Clinical Neurophysiology, 2019",
  },
  {
    icon: "flower-outline",
    text: "Every contraction is a step closer to meeting your baby. You're doing incredible work.",
    source: "Gaskin, Ina May's Guide to Childbirth, 2003",
  },
  {
    icon: "paw-outline",
    text: "Human pregnancy is 9 months, but elephants carry their babies for 22 months!",
    source: "Lueders et al., Proc. Royal Society B, 2012",
  },
  {
    icon: "paw-outline",
    text: "Kangaroo babies are born the size of a jellybean and crawl into mom's pouch.",
    source: "Tyndale-Biscoe, Life of Marsupials, CSIRO, 2005",
  },
  {
    icon: "water-outline",
    text: "Babies instinctively hold their breath underwater for a few months after birth.",
    source: "Goksor et al., Acta Paediatrica, 2002",
  },
  {
    icon: "happy-outline",
    text: "Babies start smiling socially around 6\u20138 weeks. That first real smile is worth everything.",
    source: "Messinger & Fogel, Child Development, 2007",
  },
  {
    icon: "mic-outline",
    text: "Babies babble in the rhythm of their native language before they can speak.",
    source: "de Boysson-Bardies et al., J. Child Language, 1984",
  },
];

export function FunFacts({
  onSwipeStart,
  onSwipeEnd,
}: {
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * FACTS.length)
  );
  const [collapsed, setCollapsed] = useState(false);
  const [shared, setShared] = useState(false);
  const sharedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const cardGap = 8;
  const cardWidth = Dimensions.get("window").width - 32 - cardGap;
  const pageWidth = cardWidth + cardGap;

  const goToIndex = useCallback(
    (nextIndex: number, animated = true) => {
      const normalized = (nextIndex + FACTS.length) % FACTS.length;
      scrollRef.current?.scrollTo({ x: pageWidth * normalized, animated });
      setIndex(normalized);
    },
    [pageWidth]
  );

  const nextFact = useCallback(() => {
    goToIndex(index + 1);
  }, [goToIndex, index]);

  const prevFact = useCallback(() => {
    goToIndex(index - 1);
  }, [goToIndex, index]);

  const randomFact = useCallback(() => {
    if (FACTS.length === 1) return;
    let nextIndex = index;
    while (nextIndex === index) {
      nextIndex = Math.floor(Math.random() * FACTS.length);
    }
    goToIndex(nextIndex);
  }, [goToIndex, index]);

  const shareFact = useCallback(async () => {
    const fact = FACTS[index];
    const text = `${fact.text}\n\nSource: ${fact.source}\n\n\u2014 from Theo, a contraction timer app`;
    await Clipboard.setStringAsync(text);
    if (sharedTimeoutRef.current) clearTimeout(sharedTimeoutRef.current);
    setShared(true);
    sharedTimeoutRef.current = setTimeout(() => setShared(false), 2000);
  }, [index]);

  useEffect(() => {
    return () => {
      if (sharedTimeoutRef.current) clearTimeout(sharedTimeoutRef.current);
    };
  }, []);

  // Auto-rotate
  useEffect(() => {
    if (collapsed) return;
    const interval = setInterval(nextFact, 12000);
    return () => clearInterval(interval);
  }, [nextFact, collapsed]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ x: pageWidth * index, animated: false });
  }, []);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setCollapsed(!collapsed)}
        style={styles.headerRow}
      >
        <Text style={styles.headerLabel}>DID YOU KNOW?</Text>
        <Text
          style={[
            styles.chevron,
            collapsed && { transform: [{ rotate: "-90deg" }] },
          ]}
        >
          {"\u25BE"}
        </Text>
      </Pressable>

      {!collapsed && (
        <>
          <View style={styles.navRow}>
            <Pressable onPress={prevFact}>
              <Text style={styles.navBtn}>{"\u2190"} Prev</Text>
            </Pressable>
            <Pressable onPress={randomFact} style={styles.randomBtn}>
              <Text style={styles.randomBtnText}>Random</Text>
            </Pressable>
            <Pressable onPress={shareFact} style={styles.shareBtn}>
              <Text style={styles.shareBtnText}>
                {shared ? "\u2713 Copied!" : "\u2197 Share"}
              </Text>
            </Pressable>
            <Pressable onPress={nextFact}>
              <Text style={styles.navBtn}>Next {"\u2192"}</Text>
            </Pressable>
          </View>

          <View style={[styles.carousel, { width: pageWidth }]}>
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              nestedScrollEnabled
              scrollEnabled
              onTouchStart={onSwipeStart}
              onTouchEnd={onSwipeEnd}
              onScrollBeginDrag={onSwipeStart}
              onScrollEndDrag={onSwipeEnd}
              onMomentumScrollEnd={(e) => {
                const nextIndex = Math.round(
                  e.nativeEvent.contentOffset.x / pageWidth
                );
                if (nextIndex !== index) setIndex(nextIndex);
                onSwipeEnd?.();
              }}
              bounces={false}
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              snapToInterval={pageWidth}
              decelerationRate="fast"
              contentContainerStyle={{ alignItems: "stretch" }}
            >
              {FACTS.map((item, idx) => (
                <View key={idx} style={[styles.page, { width: pageWidth, alignSelf: "stretch" }]}>
                  <View
                    style={[
                      styles.card,
                      { width: cardWidth },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={28}
                      color={colors.terracotta}
                      style={styles.emoji}
                    />
                    <Text style={styles.factText}>{item.text}</Text>
                    <Text style={styles.sourceText}>{item.source}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={styles.dotsRow}>
            {Array.from({ length: Math.min(5, FACTS.length) }, (_, i) => {
              const dotIdx = (Math.floor(index / 5) * 5 + i) % FACTS.length;
              return (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        dotIdx === index ? colors.terracotta : colors.textMuted,
                    },
                  ]}
                />
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { paddingBottom: 16 },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
      paddingVertical: 6,
    },
    headerLabel: { fontSize: 11, color: colors.textMuted, letterSpacing: 1.5 },
    chevron: { fontSize: 14, color: colors.textMuted },
    navRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    navBtn: { fontSize: 12, color: colors.terracotta, fontWeight: "500" },
    randomBtn: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: colors.beige,
    },
    randomBtnText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    shareBtn: {
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: colors.beige,
    },
    shareBtnText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    carousel: { overflow: "hidden", borderRadius: 16 },
    page: { paddingRight: 8 },
    card: {
      flex: 1,
      backgroundColor: colors.beige,
      borderRadius: 16,
      paddingVertical: 20,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 140,
    },
    emoji: { fontSize: 28, marginBottom: 8 },
    factText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 22,
      textAlign: "center",
      maxWidth: 280,
    },
    sourceText: {
      fontSize: 11,
      color: colors.textMuted,
      fontStyle: "italic",
      marginTop: 4,
      textAlign: "center",
      maxWidth: 260,
      lineHeight: 16,
    },
    dotsRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 4,
      marginTop: 8,
    },
    dot: { width: 6, height: 6, borderRadius: 3 },
  });
