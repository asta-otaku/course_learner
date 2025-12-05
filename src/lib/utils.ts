import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  isAfter,
  subDays,
  subWeeks,
  subMonths,
  startOfDay,
  endOfDay,
} from "date-fns";
import profileImage from "@/assets/profile-background.svg";
import algebra from "@/assets/algebra.png";
import ans from "@/assets/ans.png";
import ratio from "@/assets/ratio.png";
import measurement from "@/assets/measurement.png";
import { Course, DateRange, Quiz, VideoTopic, TutorProfile, TutorDetails, TransformedTutorProfile, ChangeRequest } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const dummyProfiles = [
  {
    id: "1",
    name: "Jonathan",
    year: 1,
    image: profileImage,
    status: "active",
    subscriptionDate: "2023-10-01",
    duration: 30,
    subscriptionAmount: 100,
    subscriptionName: "The platform",
  },
  {
    id: "2",
    name: "John",
    year: 1,
    image: profileImage,
    status: "active",
    subscriptionDate: "2023-09-15",
    duration: 60,
    subscriptionAmount: 400,
    subscriptionName: "Tuition",
  },
  {
    id: "3",
    name: "Doku",
    year: 1,
    image: profileImage,
    status: "active",
    subscriptionDate: "2023-08-20",
    duration: 30,
    subscriptionAmount: 200,
    subscriptionName: "The platform",
  },
  {
    id: "4",
    name: "Deku",
    year: 1,
    image: profileImage,
    status: "inactive",
    subscriptionDate: "2023-07-10",
    duration: 60,
    subscriptionAmount: 400,
    subscriptionName: "Tuition",
  },
  {
    id: "5",
    name: "Midoriyama",
    year: 3,
    image: profileImage,
    status: "inactive",
    subscriptionDate: "2023-06-05",
    duration: 30,
    subscriptionAmount: 100,
    subscriptionName: "The platform",
  },
  {
    id: "6",
    name: "Midoriyama",
    year: 3,
    image: profileImage,
    status: "active",
    subscriptionDate: "2023-05-01",
    duration: 60,
    subscriptionAmount: 400,
    subscriptionName: "Tuition",
  },
  {
    id: "7",
    name: "Midoriyama",
    year: 3,
    image: profileImage,
    status: "active",
    subscriptionDate: "2023-04-15",
    duration: 30,
    subscriptionAmount: 200,
    subscriptionName: "The platform",
  },
  {
    id: "8",
    name: "Midoriyama",
    year: 3,
    image: profileImage,
    status: "active",
    subscriptionDate: "2023-03-10",
    duration: 60,
    subscriptionAmount: 400,
    subscriptionName: "Tuition",
  },
  {
    id: "9",
    name: "Midoriyama",
    year: 3,
    image: profileImage,
    status: "active",
    subscriptionDate: "2023-02-01",
    duration: 30,
    subscriptionAmount: 100,
    subscriptionName: "The platform",
  },
];

export const dummyTutorProfiles: TutorProfile[] = [
  {
    id: "1",
    name: "Mr. Minato",
    activity: "is requesting for a code",
    time: "Today, 9:04PM",
    studentCount: 12,
    homeworkCount: 8,
    averageResponseTime: "2.3 hours",
    availability: {
      Monday: ["4-5", "5-6"],
      Tuesday: ["4-5", "6-7"],
      Wednesday: ["5-6"],
      Thursday: ["4-5", "5-6", "6-7"],
      Friday: ["4-5"],
      Saturday: ["5-6"],
      Sunday: []
    }
  },
  {
    id: "2",
    name: "Michael Jackson",
    activity: "requested a change in session time",
    time: "Today, 9:04PM",
    studentCount: 8,
    homeworkCount: 5,
    averageResponseTime: "1.8 hours",
    availability: {
      Monday: ["4-5"],
      Tuesday: ["5-6", "6-7"],
      Wednesday: ["4-5", "5-6"],
      Thursday: ["4-5"],
      Friday: ["5-6", "6-7"],
      Saturday: ["4-5", "5-6"],
      Sunday: ["4-5"]
    }
  },
  {
    id: "4",
    name: "Michael Jordan",
    activity: "requested a change in session time",
    time: "Today, 9:04PM",
    studentCount: 15,
    homeworkCount: 12,
    averageResponseTime: "3.1 hours",
    availability: {
      Monday: ["4-5", "5-6", "6-7"],
      Tuesday: ["4-5", "6-7"],
      Wednesday: ["5-6"],
      Thursday: ["4-5", "5-6"],
      Friday: ["4-5", "6-7"],
      Saturday: ["5-6"],
      Sunday: ["4-5", "5-6"]
    }
  },
  {
    id: "5",
    name: "Deku",
    activity: "submitted his homework",
    time: "Today, 9:04PM",
    studentCount: 6,
    homeworkCount: 3,
    averageResponseTime: "1.2 hours",
    availability: {
      Monday: ["4-5"],
      Tuesday: ["5-6"],
      Wednesday: ["4-5", "5-6"],
      Thursday: ["6-7"],
      Friday: ["4-5", "5-6"],
      Saturday: [],
      Sunday: ["4-5"]
    }
  },
  {
    id: "6",
    name: "John Doe",
    activity: "requested a change in session time",
    time: "Today, 9:04PM",
    studentCount: 10,
    homeworkCount: 7,
    averageResponseTime: "2.7 hours",
    availability: {
      Monday: ["5-6", "6-7"],
      Tuesday: ["4-5"],
      Wednesday: ["4-5", "5-6", "6-7"],
      Thursday: ["4-5", "5-6"],
      Friday: ["5-6"],
      Saturday: ["4-5", "6-7"],
      Sunday: ["5-6"]
    }
  }
]

export const courses: Course[] = [
  {
    image: algebra,
    course: "Mathematics",
    topics: [
      { title: "Algebra Basics", number_of_quizzes: 4 },
      { title: "Linear Equations", number_of_quizzes: 3 },
      { title: "Quadratic Functions", number_of_quizzes: 5 },
    ],
    progress: 40,
    duration: 120,
    total_section: 12,
    completed_section: 5,
  },
  {
    image: ratio,
    course: "Mathematics",
    topics: [
      { title: "Understanding Ratios", number_of_quizzes: 2 },
      { title: "Proportions", number_of_quizzes: 3 },
      { title: "Rate Problems", number_of_quizzes: 2 },
    ],
    progress: 60,
    duration: 90,
    total_section: 10,
    completed_section: 6,
  },
  {
    image: algebra,
    course: "Mathematics",
    topics: [
      { title: "Angles & Triangles", number_of_quizzes: 4 },
      { title: "Circles & Arcs", number_of_quizzes: 3 },
      { title: "Coordinate Geometry", number_of_quizzes: 4 },
    ],
    progress: 25,
    duration: 110,
    total_section: 14,
    completed_section: 3,
  },
  {
    image: measurement,
    course: "Science",
    topics: [
      { title: "Measurement Techniques", number_of_quizzes: 3 },
      { title: "Units & Conversions", number_of_quizzes: 2 },
      { title: "Precision & Accuracy", number_of_quizzes: 2 },
    ],
    progress: 20,
    duration: 150,
    total_section: 8,
    completed_section: 1,
  },
  {
    image: ratio,
    course: "Science",
    topics: [
      { title: "Atomic Structure", number_of_quizzes: 3 },
      { title: "Periodic Table", number_of_quizzes: 2 },
      { title: "Chemical Bonding", number_of_quizzes: 3 },
    ],
    progress: 55,
    duration: 130,
    total_section: 9,
    completed_section: 5,
  },
  {
    image: measurement,
    course: "Science",
    topics: [
      { title: "Newton’s Laws", number_of_quizzes: 4 },
      { title: "Work & Energy", number_of_quizzes: 3 },
      { title: "Momentum", number_of_quizzes: 3 },
    ],
    progress: 75,
    duration: 140,
    total_section: 12,
    completed_section: 9,
  },
  {
    image: ans,
    course: "Biology",
    topics: [
      { title: "Cell Structure", number_of_quizzes: 3 },
      { title: "Photosynthesis", number_of_quizzes: 2 },
      { title: "Genetics", number_of_quizzes: 3 },
    ],
    progress: 45,
    duration: 100,
    total_section: 11,
    completed_section: 5,
  },
  {
    image: ans,
    course: "Mathematics",
    topics: [
      { title: "Arithmetic & Number Systems", number_of_quizzes: 5 },
      { title: "Prime Factors", number_of_quizzes: 4 },
      { title: "Fractions & Decimals", number_of_quizzes: 4 },
    ],
    progress: 80,
    duration: 100,
    total_section: 12,
    completed_section: 10,
  },
  {
    image: ratio,
    course: "English",
    topics: [
      { title: "Parts of Speech", number_of_quizzes: 2 },
      { title: "Sentence Structure", number_of_quizzes: 3 },
      { title: "Punctuation", number_of_quizzes: 2 },
    ],
    progress: 30,
    duration: 80,
    total_section: 6,
    completed_section: 2,
  },
  {
    image: ans,
    course: "English",
    topics: [
      { title: "Roots & Affixes", number_of_quizzes: 3 },
      { title: "Context Clues", number_of_quizzes: 2 },
      { title: "Synonyms & Antonyms", number_of_quizzes: 3 },
    ],
    progress: 50,
    duration: 95,
    total_section: 7,
    completed_section: 3,
  },
];

export const convertDuration = (progress: number, duration: number) => {
  const remainingMinutes = Math.ceil(duration * (1 - progress / 100));
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;

  if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} left`;
  } else {
    return `${minutes} minute${minutes > 1 ? "s" : ""} left`;
  }
};

export function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/&/g, "-and-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getCurrentTopic(course: Course): {
  title: string;
  number_of_quizzes: number;
} {
  const idx = course.completed_section;
  const maxIdx = course.topics.length - 1;
  const safeIdx = idx > maxIdx ? maxIdx : idx;
  return course.topics[safeIdx];
}

export function generateHomeworkWithStatus(
  statuses: readonly ["TO-DO", "SUBMITTED", "DONE AND MARKED"]
): {
  title: string;
  due: string;
  course: string;
  topic: string;
  href: string;
  status: (typeof statuses)[number];
}[] {
  const today = new Date();
  const getRandomOffset = () => Math.floor(Math.random() * 14 - 7); // -7 to +6 days
  const getRandomStatus = (): (typeof statuses)[number] =>
    statuses[Math.floor(Math.random() * statuses.length)];

  return courses.flatMap((course) =>
    course.topics.map((topic, index) => {
      const offset = getRandomOffset();
      const due = new Date();
      due.setDate(today.getDate() + offset);
      return {
        title: `Homework ${index + 1}`,
        course: course.course,
        topic: topic.title,
        due: due.toISOString(),
        href: `/dashboard/${slugify(course.course)}/${slugify(topic.title)}`,
        status: getRandomStatus(),
      };
    })
  );
}

export function generateHomeworkWithDates() {
  const today = new Date();
  const getRandomOffset = () => Math.floor(Math.random() * 14 - 7);
  return courses.flatMap((course) =>
    course.topics.map((topic, index) => {
      const offset = getRandomOffset();
      const due = new Date();
      due.setDate(today.getDate() + offset);
      return {
        title: `Homework ${index + 1}`,
        course: course.course,
        topic: topic.title,
        due: due.toISOString(),
        href: `/dashboard/${slugify(course.course)}/${slugify(topic.title)}`,
      };
    })
  );
}

export function isWithinDateRange(date: Date, range: DateRange): boolean {
  const now = new Date();
  const start = (d: Date) => startOfDay(d);
  const end = (d: Date) => endOfDay(d);

  switch (range) {
    case "ALL":
      return true;
    case "TODAY":
      return date >= start(now) && date <= end(now);
    case "LAST_3_DAYS":
      return isAfter(date, subDays(now, 3));
    case "LAST_WEEK":
      return isAfter(date, subWeeks(now, 1));
    case "LAST_TWO_WEEKS":
      return isAfter(date, subWeeks(now, 2));
    case "LAST_MONTH":
      return isAfter(date, subMonths(now, 1));
    case "LAST_3_MONTHS":
      return isAfter(date, subMonths(now, 3));
    default:
      return true;
  }
}

export const formatDisplayDate = (dateString: string) => {
  const date = new Date(dateString);
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  return {
    date: `${months[date.getMonth()]} ${date.getDate()}`,
    day: days[date.getDay()],
  };
};

export const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THUR", "FRI", "SAT"];

export const days = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const tutorHomeworkMockData = [
  {
    student: "Dean Henderson",
    year: "Year 1",
    homework: "Quiz 1",
    topic: "Numbers",
    status: "TO-DO",
    action: "Start",
  },
  {
    student: "Deku",
    year: "Year 4",
    homework: "Quiz 4",
    topic: "Place Value",
    status: "SUBMITTED",
    action: "View",
  },
  {
    student: "Sung Jin Woo",
    year: "Year 3",
    homework: "Quiz 5",
    topic: "Statistics",
    status: "DONE AND MARKED",
    action: "Review",
  },
  {
    student: "Choso",
    year: "Year 1",
    homework: "Quiz 4",
    topic: "Number",
    status: "TO-DO",
    action: "Start",
  },
  {
    student: "Itadori",
    year: "Year 1",
    homework: "Quiz 2",
    topic: "Algebra",
    status: "SUBMITTED",
    action: "View",
  },
  {
    student: "Panda",
    year: "Year 2",
    homework: "Quiz 3",
    topic: "Algebra",
    status: "DONE AND MARKED",
    action: "Review",
  },
];

// Quick responses for messaging platform
export const tutorQuickResponses = [
  "I'll review your work and get back to you shortly.",
  "Great question! Let me explain this step by step.",
  "I've attached some additional resources for you.",
  "Your progress is excellent! Keep up the good work.",
  "Let's schedule a session to go through this in detail.",
  "I'll send you some practice questions on this topic.",
  "This is a common misconception. Here's the correct approach:",
  "Your homework is due tomorrow. How are you progressing?",
  "I've marked your assignment. Check your dashboard for feedback.",
  "Would you like me to explain this concept further?"
];

export const studentQuickResponses = [
  "I'm having trouble with this problem. Can you help?",
  "I've completed my homework. Can you review it?",
  "When is our next session?",
  "I don't understand this concept. Can you explain?",
  "Thank you for the explanation!",
  "I've been practicing and I think I'm improving.",
  "Can you send me more practice questions?",
  "I'm ready for our lesson.",
  "I have a question about the assignment.",
  "Thank you for your help!"
];

// Response generation functions for messaging platform
export const generateTutorResponse = (studentName: string, userMessage: string): string => {
  const responses = [
    "Thank you for explaining that! I understand it better now.",
    "I'll practice this and let you know if I have more questions.",
    "That makes so much sense! Thank you for your help.",
    "I'm working on the homework now. I'll send it when I'm done.",
    "Can you explain this part a bit more?",
    "I've been practicing and I think I'm getting better at this.",
    "When can we have our next session?",
    "I have another question about a different topic.",
    "Thank you for being so patient with me.",
    "I'm ready for our next lesson!",
    "I'm still confused about this concept. Can you help?",
    "I've completed the assignment. Can you check it?",
    "This is really helpful! Thank you.",
    "I'm struggling with this problem. Can you guide me?",
    "I think I understand now. Let me try solving it."
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
};

export const generateStudentResponse = (tutorName: string, userMessage: string): string => {
  const responses = [
    `Thank you for your message! I'll review this and provide you with a detailed explanation.`,
    `Great question! Let me break this down for you step by step.`,
    `I appreciate you reaching out. This is an important concept to understand.`,
    `Excellent work! I can see you're making good progress.`,
    `I understand your confusion. Let me clarify this for you.`,
    `That's a thoughtful question. Here's what you need to know.`,
    `I'm here to help. Let me explain this concept clearly.`,
    `You're on the right track! Let me guide you through this.`,
    `I'll prepare some additional resources for you.`,
    `Your dedication is impressive. Let's work through this together.`,
    `I've marked your assignment. Check your dashboard for feedback.`,
    `Let's schedule a session to go through this in detail.`,
    `I'll send you some practice questions on this topic.`,
    `This is a common misconception. Here's the correct approach:`,
    `Your homework is due tomorrow. How are you progressing?`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
};

// Dummy data for all code requests
export const allCodeRequests = [
  // New requests
  {
    id: 1,
    type: "new",
    status: "Attempted",
    sent: false,
    canApprove: false,
    user: {
      name: "Alex Eze",
      email: "alex.eze@gmail.com",
      phone: "08029752645",
      child: {
        name: "Ezekiel Badmus",
        year: "4",
        offer: "Offer 2",
      },
    },
  },
  {
    id: 2,
    type: "new",
    status: "Not Called",
    sent: true,
    canApprove: true,
    user: {
      name: "Sarah Johnson",
      email: "sarah.johnson@gmail.com",
      phone: "09012345678",
      child: {
        name: "Michael Johnson",
        year: "3",
        offer: "Offer 1",
      },
    },
  },
  {
    id: 3,
    type: "new",
    status: "Called",
    sent: false,
    canApprove: true,
    user: {
      name: "David Chen",
      email: "david.chen@gmail.com",
      phone: "07098765432",
      child: {
        name: "Emma Chen",
        year: "5",
        offer: "Offer 2",
      },
    },
  },
  {
    id: 4,
    type: "new",
    status: "Not Called",
    sent: false,
    canApprove: false,
    user: {
      name: "Maria Garcia",
      email: "maria.garcia@gmail.com",
      phone: "08123456789",
      child: {
        name: "Sofia Garcia",
        year: "2",
        offer: "Offer 1",
      },
    },
  },
  {
    id: 5,
    type: "new",
    status: "Not Called",
    sent: true,
    canApprove: true,
    user: {
      name: "James Wilson",
      email: "james.wilson@gmail.com",
      phone: "09234567890",
      child: {
        name: "Lucas Wilson",
        year: "6",
        offer: "Offer 2",
      },
    },
  },
  {
    id: 6,
    type: "new",
    status: "Not Called",
    sent: false,
    canApprove: false,
    user: {
      name: "Fatima Ahmed",
      email: "fatima.ahmed@gmail.com",
      phone: "07345678901",
      child: {
        name: "Aisha Ahmed",
        year: "4",
        offer: "Offer 1",
      },
    },
  },
  {
    id: 7,
    type: "new",
    status: "Not Called",
    sent: false,
    canApprove: false,
    user: {
      name: "Robert Kim",
      email: "robert.kim@gmail.com",
      phone: "08456789012",
      child: {
        name: "Jin Kim",
        year: "3",
        offer: "Offer 1",
      },
    },
  },
  {
    id: 8,
    type: "new",
    status: "Not Called",
    sent: true,
    canApprove: true,
    user: {
      name: "Lisa Thompson",
      email: "lisa.thompson@gmail.com",
      phone: "07567890123",
      child: {
        name: "Olivia Thompson",
        year: "5",
        offer: "Offer 2",
      },
    },
  },
  // Used codes
  {
    id: 9,
    type: "used",
    user: {
      name: "Alex Eze",
      email: "alex.eze@gmail.com",
      phone: "08029752645",
      child: {
        name: "Ezekiel Badmus",
        year: "4",
        offer: "Offer 2",
      },
    },
  },
  {
    id: 10,
    type: "used",
    user: {
      name: "Sarah Johnson",
      email: "sarah.johnson@gmail.com",
      phone: "09012345678",
      child: {
        name: "Michael Johnson",
        year: "3",
        offer: "Offer 1",
      },
    },
  },
  {
    id: 11,
    type: "used",
    user: {
      name: "David Chen",
      email: "david.chen@gmail.com",
      phone: "07098765432",
      child: {
        name: "Emma Chen",
        year: "5",
        offer: "Offer 2",
      },
    },
  },
];


export const formatTime = (timeString: string) => {
  return timeString.substring(0, 5); // Extract HH:MM from HH:MM:SS
};

export const formatTimeSlotLabel = (startTime: string, endTime: string) => {
  const start = formatTime(startTime);
  const end = formatTime(endTime);
  return `${start} - ${end}`;
};

// Utility functions for timeslot availability
export const getAvailableDays = (timeslotsData: any) => {
  if (!timeslotsData?.data) return [];

  const daysWithSlots = new Set(
    timeslotsData.data
      .filter((slot: any) => slot.isActive)
      .map((slot: any) => slot.dayOfWeek)
  );

  // Return days in the original order, but only those with timeslots
  return days.filter((day) => daysWithSlots.has(day));
};

export const isDaySelected = (day: string, timeslotsData: any, selectedTimeslotIds: string[]) => {
  // Check if any timeslots for this day are selected
  const dayTimeslots =
    timeslotsData?.data?.filter(
      (slot: any) => slot.dayOfWeek === day && slot.isActive
    ) || [];
  return dayTimeslots.some((slot: any) =>
    selectedTimeslotIds.includes(slot.id)
  );
};

export const getTimeslotsForDay = (day: string, timeslotsData: any) => {
  return timeslotsData?.data?.filter(
    (slot: any) => slot.dayOfWeek === day && slot.isActive
  ) || [];
};

// Transform API tutor data to component format
export const transformTutorData = (tutors: TutorDetails[]): TransformedTutorProfile[] => {
  return tutors.map((tutor) => {
    // Convert timeSlots to availability format
    const availability: { [day: string]: string[] } = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: []
    };

    tutor.timeSlots.forEach((slot) => {
      if (slot.isActive) {
        const dayMap: { [key: string]: string } = {
          'MONDAY': 'Monday',
          'TUESDAY': 'Tuesday', 
          'WEDNESDAY': 'Wednesday',
          'THURSDAY': 'Thursday',
          'FRIDAY': 'Friday',
          'SATURDAY': 'Saturday',
          'SUNDAY': 'Sunday'
        };
        
        const day = dayMap[slot.dayOfWeek];
        if (day) {
          const timeLabel = formatTimeSlotLabel(slot.startTime, slot.endTime);
          availability[day].push(timeLabel);
        }
      }
    });

    return {
      id: tutor.id,
      name: `${tutor.user.firstName} ${tutor.user.lastName}`,
      activity: "Active tutor", // Default activity since not provided in API
      time: "Today", // Default time since not provided in API
      studentCount: tutor.assignedStudents.length,
      homeworkCount: 0, // Default since not provided in API
      averageResponseTime: "N/A", // Default since not provided in API
      availability
    };
  });
};

// Create change requests based on actual tutor data
export const createChangeRequestsFromTutors = (tutors: TutorDetails[]): ChangeRequest[] => {
  if (tutors.length < 2) return [];
  
  // Create a sample change request using actual tutor data
  return [
    {
      id: "1", 
      className: "Class Red",
      currentTutorId: tutors[0].id,
      currentTutor: `${tutors[0].user.firstName} ${tutors[0].user.lastName}`,
      requestedTutorId: tutors[1].id,
      requestedTutor: `${tutors[1].user.firstName} ${tutors[1].user.lastName}`,
      status: "pending",
      requestDate: new Date().toISOString().split('T')[0],
    }
  ];
};