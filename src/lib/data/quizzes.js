// UPSC Prelims-style MCQ quizzes.
// Static deterministic data only — no imports, no randomness.
export const QUIZZES = [
  {
    id: 'quiz-polity',
    title: 'Polity Quiz',
    emoji: '🏛️',
    color: '#E8590C',
    description: 'Constitution, Parliament and the courts, MCQ style.',
    minutes: 8,
    questions: [
      {
        id: 'quiz-polity-q01',
        question: 'Which Article of the Constitution deals with the Comptroller and Auditor General of India?',
        options: ['Article 76', 'Article 148', 'Article 149', 'Article 150'],
        correctIndex: 1,
        explanation: 'Article 148 establishes the office of the Comptroller and Auditor General; Articles 149 and 150 deal with his duties and the form of accounts.'
      },
      {
        id: 'quiz-polity-q02',
        question: 'How many Schedules did the Constitution of India originally contain?',
        options: ['Six', 'Eight', 'Ten', 'Twelve'],
        correctIndex: 1,
        explanation: 'The Constitution originally had eight Schedules; amendments have since increased the number to twelve.'
      },
      {
        id: 'quiz-polity-q03',
        question: 'Abolition of untouchability is guaranteed under which Article of the Constitution?',
        options: ['Article 14', 'Article 15', 'Article 17', 'Article 23'],
        correctIndex: 2,
        explanation: 'Article 17 abolishes untouchability and forbids its practice in any form; Articles 14 and 15 guarantee equality and prohibit discrimination.'
      },
      {
        id: 'quiz-polity-q04',
        question: 'What fraction of the members of the Rajya Sabha retire every two years?',
        options: ['One-fourth', 'One-third', 'One-half', 'All members'],
        correctIndex: 1,
        explanation: 'The Rajya Sabha is a permanent House; one-third of its members retire every two years and fresh elections fill the vacancies.'
      },
      {
        id: 'quiz-polity-q05',
        question: 'Who administers the oath of office to the President of India?',
        options: ['The Chief Justice of India', 'The Vice-President', 'The Speaker of the Lok Sabha', 'The Chief Election Commissioner'],
        correctIndex: 0,
        explanation: 'Under Article 60, the President takes the oath before the Chief Justice of India, or in his absence, the senior-most judge of the Supreme Court.'
      },
      {
        id: 'quiz-polity-q06',
        question: 'The definition of a Money Bill is given in which Article of the Constitution?',
        options: ['Article 108', 'Article 109', 'Article 110', 'Article 117'],
        correctIndex: 2,
        explanation: 'Article 110 defines a Money Bill; Article 109 sets out the special procedure for such Bills in the Rajya Sabha.'
      },
      {
        id: 'quiz-polity-q07',
        question: 'The President of India can promulgate an ordinance under which Article of the Constitution?',
        options: ['Article 121', 'Article 123', 'Article 352', 'Article 356'],
        correctIndex: 1,
        explanation: 'Article 123 empowers the President to promulgate ordinances when Parliament is not in session; Article 352 covers the proclamation of national emergency.'
      },
      {
        id: 'quiz-polity-q08',
        question: 'What is the minimum age prescribed for a person to be eligible for election as President of India?',
        options: ['30 years', '35 years', '40 years', '25 years'],
        correctIndex: 1,
        explanation: 'Article 58 requires the President to be a citizen of India, at least 35 years old, and qualified for election as a member of the Lok Sabha.'
      },
      {
        id: 'quiz-polity-q09',
        question: 'What is the maximum strength of the Rajya Sabha as provided under Article 80?',
        options: ['245 members', '250 members', '252 members', '260 members'],
        correctIndex: 1,
        explanation: 'Article 80 fixes the Rajya Sabha strength at a maximum of 250 members — 238 elected and 12 nominated by the President.'
      },
      {
        id: 'quiz-polity-q10',
        question: 'Which Constitutional Amendment provided for reservation for Other Backward Classes in admission to private educational institutions?',
        options: ['91st Amendment', '93rd Amendment', '99th Amendment', '101st Amendment'],
        correctIndex: 1,
        explanation: 'The 93rd Amendment Act, 2005 added Article 15(5), enabling the state to make special provisions for OBCs and SCs/STs in aided or unaided private educational institutions.'
      }
    ]
  },
  {
    id: 'quiz-history',
    title: 'Modern History Quiz',
    emoji: '🕰️',
    color: '#B23A2E',
    description: 'The freedom movement and its turning points.',
    minutes: 8,
    questions: [
      {
        id: 'quiz-history-q01',
        question: 'The Revolt of 1857 first broke out at which place?',
        options: ['Delhi', 'Meerut', 'Kanpur', 'Lucknow'],
        correctIndex: 1,
        explanation: 'The revolt erupted at Meerut on 10 May 1857 when sepoys of the Bengal Army mutinied, and it subsequently spread to Delhi and other centres.'
      },
      {
        id: 'quiz-history-q02',
        question: 'Who founded the Indian National Congress in 1885?',
        options: ['Dadabhai Naoroji', 'Allan Octavian Hume', 'W. C. Bonnerjee', 'Annie Besant'],
        correctIndex: 1,
        explanation: 'A. O. Hume, a retired British civil servant, founded the Indian National Congress, which held its first session in Bombay in 1885 under W. C. Bonnerjee.'
      },
      {
        id: 'quiz-history-q03',
        question: 'The Jallianwala Bagh massacre took place on which date?',
        options: ['13 April 1917', '6 April 1919', '13 April 1919', '30 March 1919'],
        correctIndex: 2,
        explanation: 'On 13 April 1919, General Dyer ordered firing on an unarmed gathering at Jallianwala Bagh in Amritsar on the occasion of Baisakhi.'
      },
      {
        id: 'quiz-history-q04',
        question: 'The Chauri Chaura incident of February 1922 led to the withdrawal of which movement?',
        options: ['Civil Disobedience Movement', 'Non-Cooperation Movement', 'Quit India Movement', 'Swadeshi Movement'],
        correctIndex: 1,
        explanation: 'After a mob burnt a police station at Chauri Chaura, Mahatma Gandhi withdrew the Non-Cooperation Movement in February 1922.'
      },
      {
        id: 'quiz-history-q05',
        question: 'Who wrote the novel "Anandamath", which contains the song "Vande Mataram"?',
        options: ['Rabindranath Tagore', 'Bankim Chandra Chatterjee', 'Saratchandra Chattopadhyay', 'R. C. Dutt'],
        correctIndex: 1,
        explanation: 'Bankim Chandra Chatterjee wrote "Anandamath" in 1882; its song "Vande Mataram" later became a rallying cry of the freedom struggle.'
      },
      {
        id: 'quiz-history-q06',
        question: 'The resolution demanding Purna Swaraj was passed at the Lahore Session of the Congress in 1929, presided over by whom?',
        options: ['Jawaharlal Nehru', 'Subhas Chandra Bose', 'Motilal Nehru', 'C. R. Das'],
        correctIndex: 0,
        explanation: 'Jawaharlal Nehru presided over the 1929 Lahore Session, where the Congress declared Purna Swaraj as its goal and 26 January 1930 as Independence Day.'
      },
      {
        id: 'quiz-history-q07',
        question: 'The Simon Commission arrived in India in which year?',
        options: ['1927', '1928', '1929', '1930'],
        correctIndex: 1,
        explanation: 'The all-white Simon Commission reached India in February 1928 and was met with black-flag protests under the slogan "Simon Go Back".'
      },
      {
        id: 'quiz-history-q08',
        question: 'Mahatma Gandhi began the Dandi March from Sabarmati Ashram on which date?',
        options: ['12 March 1930', '6 April 1930', '12 March 1929', '26 January 1930'],
        correctIndex: 0,
        explanation: 'The Salt March started from Sabarmati Ashram on 12 March 1930 and reached Dandi on 6 April 1930, inaugurating the Civil Disobedience Movement.'
      },
      {
        id: 'quiz-history-q09',
        question: 'The Cabinet Mission of 1946 was headed by which Viceroy of India?',
        options: ['Lord Linlithgow', 'Lord Wavell', 'Lord Mountbatten', 'Lord Irwin'],
        correctIndex: 1,
        explanation: 'The Cabinet Mission, sent in 1946 to propose a framework for India\'s independence, operated under Viceroy Lord Wavell.'
      },
      {
        id: 'quiz-history-q10',
        question: 'The Cripps Mission was sent to India in which year?',
        options: ['1940', '1942', '1945', '1946'],
        correctIndex: 1,
        explanation: 'Sir Stafford Cripps arrived in March 1942 with proposals for Indian self-government after the war; the Congress rejected the offer.'
      }
    ]
  },
  {
    id: 'quiz-geography',
    title: 'Geography Quiz',
    emoji: '🗺️',
    color: '#1E7A46',
    description: 'Rivers, climate and physical features of India.',
    minutes: 8,
    questions: [
      {
        id: 'quiz-geography-q01',
        question: 'Which river is known as the "Sorrow of Bihar" because of its frequent floods?',
        options: ['Gandak', 'Kosi', 'Son', 'Ghaghara'],
        correctIndex: 1,
        explanation: 'The Kosi, which shifts its course frequently and floods the Bihar plains, is called the "Sorrow of Bihar".'
      },
      {
        id: 'quiz-geography-q02',
        question: 'The Tropic of Cancer passes through how many states of India?',
        options: ['Six', 'Seven', 'Eight', 'Nine'],
        correctIndex: 2,
        explanation: 'The Tropic of Cancer passes through eight states: Gujarat, Rajasthan, Madhya Pradesh, Chhattisgarh, Jharkhand, West Bengal, Tripura and Mizoram.'
      },
      {
        id: 'quiz-geography-q03',
        question: 'Which is the longest river of Peninsular India?',
        options: ['Krishna', 'Godavari', 'Mahanadi', 'Kaveri'],
        correctIndex: 1,
        explanation: 'The Godavari, rising near Trimbakeshwar in Maharashtra, is about 1,465 km long, making it the longest peninsular river.'
      },
      {
        id: 'quiz-geography-q04',
        question: 'The Western Ghats are also known by which name?',
        options: ['Sahyadri', 'Nilgiri', 'Cardamom Hills', 'Aravali'],
        correctIndex: 0,
        explanation: 'The Western Ghats are locally known as the Sahyadri; the Nilgiri and Cardamom Hills are part of this range.'
      },
      {
        id: 'quiz-geography-q05',
        question: 'Which type of soil is most suitable for the cultivation of cotton in India?',
        options: ['Alluvial soil', 'Black soil', 'Red soil', 'Laterite soil'],
        correctIndex: 1,
        explanation: 'Black or regur soil, which is rich in clay and retains moisture, is ideal for cotton and is hence called "black cotton soil".'
      },
      {
        id: 'quiz-geography-q06',
        question: 'Most of the annual rainfall in India is received from which monsoon?',
        options: ['North-East monsoon', 'South-West monsoon', 'Western disturbances', 'Cyclonic storms'],
        correctIndex: 1,
        explanation: 'The South-West monsoon, arriving around June and lasting till September, contributes about 75 per cent of India\'s annual rainfall.'
      },
      {
        id: 'quiz-geography-q07',
        question: 'Which is the highest peak located within the territory of India?',
        options: ['Nanda Devi', 'Kangchenjunga', 'K2', 'Kamet'],
        correctIndex: 1,
        explanation: 'Kangchenjunga (8,586 m), on the India-Nepal border, is the highest peak within India; K2 lies in Pakistan-administered territory.'
      },
      {
        id: 'quiz-geography-q08',
        question: 'Which of the following rivers of India flows through a rift valley?',
        options: ['Godavari', 'Narmada', 'Krishna', 'Kaveri'],
        correctIndex: 1,
        explanation: 'The Narmada and the Tapi flow through rift valleys between the Vindhya and Satpura ranges, draining into the Arabian Sea.'
      },
      {
        id: 'quiz-geography-q09',
        question: 'Which of the following rivers does NOT originate from the Western Ghats?',
        options: ['Krishna', 'Narmada', 'Kaveri', 'Godavari'],
        correctIndex: 1,
        explanation: 'The Narmada rises from the Amarkantak plateau in the Maikal range; the Krishna, Kaveri and Godavari all originate in the Western Ghats.'
      },
      {
        id: 'quiz-geography-q10',
        question: 'The hot, dry local winds called "Loo" blow over which region of India during the summer season?',
        options: ['Northern plains of India', 'Deccan plateau', 'Coastal regions of Kerala', 'North-eastern hills'],
        correctIndex: 0,
        explanation: 'The Loo, a strong hot and dry wind, blows over the northern plains of India, especially Punjab, Haryana, Rajasthan and Uttar Pradesh, in summer.'
      }
    ]
  },
  {
    id: 'quiz-mixed',
    title: 'Grand Mixed Test',
    emoji: '📝',
    color: '#2B5AA8',
    description: 'A mixed bag across all five UPSC subjects.',
    minutes: 8,
    questions: [
      {
        id: 'quiz-mixed-q01',
        question: 'On which date did the Constitution of India come into force?',
        options: ['15 August 1947', '26 January 1950', '26 November 1949', '26 January 1949'],
        correctIndex: 1,
        explanation: 'The Constitution was adopted on 26 November 1949 and came into force on 26 January 1950, celebrated as Republic Day.'
      },
      {
        id: 'quiz-mixed-q02',
        question: 'Which is the largest state of India by area?',
        options: ['Madhya Pradesh', 'Rajasthan', 'Maharashtra', 'Uttar Pradesh'],
        correctIndex: 1,
        explanation: 'Rajasthan, with an area of about 342,239 sq km, is the largest state of India by area; Uttar Pradesh is the most populous.'
      },
      {
        id: 'quiz-mixed-q03',
        question: 'The First Five Year Plan of India (1951-56) was based on which model?',
        options: ['Mahalanobis model', 'Harrod-Domar model', 'Feldman model', 'Lewis model'],
        correctIndex: 1,
        explanation: 'The First Plan was based on the Harrod-Domar model, focusing on agriculture and irrigation; the Mahalanobis model shaped the Second Plan.'
      },
      {
        id: 'quiz-mixed-q04',
        question: 'The Quit India Movement was launched in which year?',
        options: ['1940', '1942', '1943', '1944'],
        correctIndex: 1,
        explanation: 'The Quit India Movement was launched on 8 August 1942 with the call "Do or Die" at the Bombay session of the Congress.'
      },
      {
        id: 'quiz-mixed-q05',
        question: 'The Fundamental Duties of Indian citizens are enshrined in which Article of the Constitution?',
        options: ['Article 32', 'Article 51A', 'Article 356', 'Article 368'],
        correctIndex: 1,
        explanation: 'Article 51A lists the eleven Fundamental Duties, added by the 42nd Amendment Act of 1976 on the recommendation of the Swaran Singh Committee.'
      },
      {
        id: 'quiz-mixed-q06',
        question: 'Which classical dance form is associated with the state of Kerala?',
        options: ['Kathakali', 'Kathak', 'Kuchipudi', 'Odissi'],
        correctIndex: 0,
        explanation: 'Kathakali, with its elaborate make-up and gestures, is the classical dance of Kerala; Kathak belongs to the north and Kuchipudi to Andhra Pradesh.'
      },
      {
        id: 'quiz-mixed-q07',
        question: 'In which year was the Reserve Bank of India established?',
        options: ['1935', '1947', '1949', '1950'],
        correctIndex: 0,
        explanation: 'The Reserve Bank of India was established on 1 April 1935 under the RBI Act of 1934, and was nationalised in 1949.'
      },
      {
        id: 'quiz-mixed-q08',
        question: 'Which of the following is a cold ocean current?',
        options: ['Gulf Stream', 'Kuroshio Current', 'Canary Current', 'Brazil Current'],
        correctIndex: 2,
        explanation: 'The Canary Current flows southward along the north-west coast of Africa and is a cold current; the Gulf Stream, Kuroshio and Brazil Currents are warm.'
      },
      {
        id: 'quiz-mixed-q09',
        question: 'The Khajuraho group of temples was built by the rulers of which dynasty?',
        options: ['Chola', 'Chandela', 'Parmara', 'Solanki'],
        correctIndex: 1,
        explanation: 'The Khajuraho temples in Madhya Pradesh were built by the Chandela dynasty between the 10th and 12th centuries.'
      },
      {
        id: 'quiz-mixed-q10',
        question: 'In India, the "Repo Rate" is the rate at which which of the following happens?',
        options: ['RBI lends short-term funds to commercial banks', 'Commercial banks lend funds to the RBI', 'Commercial banks lend to their customers', 'The government borrows from the RBI'],
        correctIndex: 0,
        explanation: 'The repo rate is the rate at which the RBI lends short-term funds to commercial banks against government securities; the reverse repo rate applies to RBI\'s borrowing from banks.'
      }
    ]
  }
];
