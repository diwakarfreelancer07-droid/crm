
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  passwordHash: 'passwordHash',
  role: 'role',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  otp: 'otp',
  otpExpiresAt: 'otpExpiresAt',
  emailVerified: 'emailVerified',
  imageUrl: 'imageUrl'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  title: 'title',
  message: 'message',
  type: 'type',
  isRead: 'isRead',
  createdAt: 'createdAt'
};

exports.Prisma.AgentProfileScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  companyName: 'companyName',
  address: 'address',
  phone: 'phone',
  commission: 'commission'
};

exports.Prisma.CounselorProfileScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  phone: 'phone',
  department: 'department',
  designation: 'designation',
  salary: 'salary',
  joiningDate: 'joiningDate',
  agentId: 'agentId'
};

exports.Prisma.EmployeeProfileScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  phone: 'phone',
  department: 'department',
  designation: 'designation',
  salary: 'salary',
  joiningDate: 'joiningDate'
};

exports.Prisma.LeadScalarFieldEnum = {
  id: 'id',
  name: 'name',
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'email',
  phone: 'phone',
  alternateNo: 'alternateNo',
  dateOfBirth: 'dateOfBirth',
  gender: 'gender',
  nationality: 'nationality',
  maritalStatus: 'maritalStatus',
  address: 'address',
  highestQualification: 'highestQualification',
  interestedCourse: 'interestedCourse',
  testName: 'testName',
  testScore: 'testScore',
  interestedCountry: 'interestedCountry',
  intake: 'intake',
  applyLevel: 'applyLevel',
  message: 'message',
  source: 'source',
  data: 'data',
  status: 'status',
  temperature: 'temperature',
  remark: 'remark',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  imageUrl: 'imageUrl',
  userId: 'userId',
  passportNo: 'passportNo',
  passportIssueDate: 'passportIssueDate',
  passportExpiryDate: 'passportExpiryDate',
  proficiencyExams: 'proficiencyExams'
};

exports.Prisma.FollowUpScalarFieldEnum = {
  id: 'id',
  leadId: 'leadId',
  userId: 'userId',
  type: 'type',
  status: 'status',
  nextFollowUpAt: 'nextFollowUpAt',
  remark: 'remark',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AppointmentScalarFieldEnum = {
  id: 'id',
  leadId: 'leadId',
  userId: 'userId',
  title: 'title',
  description: 'description',
  startTime: 'startTime',
  endTime: 'endTime',
  status: 'status',
  location: 'location',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LeadAssignmentScalarFieldEnum = {
  id: 'id',
  leadId: 'leadId',
  assignedTo: 'assignedTo',
  assignedBy: 'assignedBy',
  assignedAt: 'assignedAt'
};

exports.Prisma.LeadActivityScalarFieldEnum = {
  id: 'id',
  leadId: 'leadId',
  userId: 'userId',
  type: 'type',
  content: 'content',
  meta: 'meta',
  createdAt: 'createdAt'
};

exports.Prisma.LeadTaskScalarFieldEnum = {
  id: 'id',
  leadId: 'leadId',
  assignedTo: 'assignedTo',
  title: 'title',
  description: 'description',
  dueAt: 'dueAt',
  status: 'status',
  createdAt: 'createdAt',
  completedAt: 'completedAt'
};

exports.Prisma.ReminderScalarFieldEnum = {
  id: 'id',
  taskId: 'taskId',
  remindAt: 'remindAt',
  isSent: 'isSent',
  sent24h: 'sent24h',
  sent1h: 'sent1h',
  sent10m: 'sent10m'
};

exports.Prisma.LeadDocumentScalarFieldEnum = {
  id: 'id',
  leadId: 'leadId',
  uploadedBy: 'uploadedBy',
  type: 'type',
  fileName: 'fileName',
  fileUrl: 'fileUrl',
  createdAt: 'createdAt'
};

exports.Prisma.StudentScalarFieldEnum = {
  id: 'id',
  leadId: 'leadId',
  name: 'name',
  email: 'email',
  phone: 'phone',
  onboardedBy: 'onboardedBy',
  status: 'status',
  createdAt: 'createdAt',
  imageUrl: 'imageUrl',
  savedAddresses: 'savedAddresses',
  studentUserId: 'studentUserId',
  passportNo: 'passportNo',
  passportIssueDate: 'passportIssueDate',
  passportExpiryDate: 'passportExpiryDate'
};

exports.Prisma.StudentDocumentScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  uploadedBy: 'uploadedBy',
  fileName: 'fileName',
  fileUrl: 'fileUrl',
  documentName: 'documentName',
  countryId: 'countryId',
  checklistId: 'checklistId',
  createdAt: 'createdAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  action: 'action',
  entity: 'entity',
  entityId: 'entityId',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.WebsiteScalarFieldEnum = {
  id: 'id',
  name: 'name',
  url: 'url',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.QualificationScalarFieldEnum = {
  id: 'id',
  name: 'name',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CountryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  code: 'code',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ApplicationScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  status: 'status',
  universityName: 'universityName',
  courseName: 'courseName',
  intake: 'intake',
  countryId: 'countryId',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ApplicationChecklistScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  countryId: 'countryId',
  isEnquiryForm: 'isEnquiryForm',
  isMandatory: 'isMandatory',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AcademicDetailScalarFieldEnum = {
  id: 'id',
  leadId: 'leadId',
  qualification: 'qualification',
  stream: 'stream',
  institution: 'institution',
  percentage: 'percentage',
  backlogs: 'backlogs',
  passingYear: 'passingYear',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WorkExperienceScalarFieldEnum = {
  id: 'id',
  leadId: 'leadId',
  companyName: 'companyName',
  position: 'position',
  startDate: 'startDate',
  endDate: 'endDate',
  totalExperience: 'totalExperience',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.Role = exports.$Enums.Role = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
  SALES_REP: 'SALES_REP',
  SUPPORT_AGENT: 'SUPPORT_AGENT',
  STUDENT: 'STUDENT',
  AGENT: 'AGENT',
  COUNSELOR: 'COUNSELOR'
};

exports.NotificationType = exports.$Enums.NotificationType = {
  LEAD_CREATED: 'LEAD_CREATED',
  LEAD_ASSIGNED: 'LEAD_ASSIGNED',
  LEAD_CONVERTED: 'LEAD_CONVERTED',
  TASK_REMINDER: 'TASK_REMINDER',
  SYSTEM: 'SYSTEM'
};

exports.LeadStatus = exports.$Enums.LeadStatus = {
  NEW: 'NEW',
  UNDER_REVIEW: 'UNDER_REVIEW',
  CONTACTED: 'CONTACTED',
  COUNSELLING_SCHEDULED: 'COUNSELLING_SCHEDULED',
  COUNSELLING_COMPLETED: 'COUNSELLING_COMPLETED',
  FOLLOWUP_REQUIRED: 'FOLLOWUP_REQUIRED',
  INTERESTED: 'INTERESTED',
  NOT_INTERESTED: 'NOT_INTERESTED',
  ON_HOLD: 'ON_HOLD',
  CLOSED: 'CLOSED'
};

exports.LeadTemperature = exports.$Enums.LeadTemperature = {
  COLD: 'COLD',
  WARM: 'WARM',
  HOT: 'HOT'
};

exports.LeadActivityType = exports.$Enums.LeadActivityType = {
  NOTE: 'NOTE',
  CALL: 'CALL',
  EMAIL: 'EMAIL',
  WHATSAPP: 'WHATSAPP',
  STATUS_CHANGE: 'STATUS_CHANGE',
  TEMPERATURE_CHANGE: 'TEMPERATURE_CHANGE',
  DOCUMENT_UPLOAD: 'DOCUMENT_UPLOAD',
  TASK_CREATED: 'TASK_CREATED',
  APPOINTMENT: 'APPOINTMENT',
  FOLLOW_UP: 'FOLLOW_UP'
};

exports.TaskStatus = exports.$Enums.TaskStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

exports.DocumentType = exports.$Enums.DocumentType = {
  QUOTATION: 'QUOTATION',
  REQUIREMENT: 'REQUIREMENT',
  ID_PROOF: 'ID_PROOF',
  PASSPORT: 'PASSPORT',
  ACADEMIC: 'ACADEMIC',
  PROFICIENCY_TEST: 'PROFICIENCY_TEST',
  WORK_EXPERIENCE: 'WORK_EXPERIENCE',
  VISA: 'VISA',
  OTHER: 'OTHER'
};

exports.StudentStatus = exports.$Enums.StudentStatus = {
  NEW: 'NEW',
  UNDER_REVIEW: 'UNDER_REVIEW',
  COUNSELLING_COMPLETED: 'COUNSELLING_COMPLETED',
  COUNSELLING_SCHEDULED: 'COUNSELLING_SCHEDULED',
  DOCUMENT_PENDING: 'DOCUMENT_PENDING',
  DOCUMENT_VERIFIED: 'DOCUMENT_VERIFIED',
  INTERESTED: 'INTERESTED',
  NOT_INTERESTED: 'NOT_INTERESTED',
  NOT_ELIGIBLE: 'NOT_ELIGIBLE',
  ON_HOLD: 'ON_HOLD'
};

exports.ApplicationStatus = exports.$Enums.ApplicationStatus = {
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  OFFER_UNCONDITIONAL: 'OFFER_UNCONDITIONAL',
  OFFER_CONDITIONAL: 'OFFER_CONDITIONAL',
  REJECTED: 'REJECTED',
  VISA_APPLIED: 'VISA_APPLIED',
  VISA_GRANTED: 'VISA_GRANTED',
  VISA_REJECTED: 'VISA_REJECTED',
  ENROLLED: 'ENROLLED'
};

exports.ChecklistType = exports.$Enums.ChecklistType = {
  MANDATORY: 'MANDATORY',
  OPTIONAL: 'OPTIONAL'
};

exports.Prisma.ModelName = {
  User: 'User',
  Notification: 'Notification',
  AgentProfile: 'AgentProfile',
  CounselorProfile: 'CounselorProfile',
  EmployeeProfile: 'EmployeeProfile',
  Lead: 'Lead',
  FollowUp: 'FollowUp',
  Appointment: 'Appointment',
  LeadAssignment: 'LeadAssignment',
  LeadActivity: 'LeadActivity',
  LeadTask: 'LeadTask',
  Reminder: 'Reminder',
  LeadDocument: 'LeadDocument',
  Student: 'Student',
  StudentDocument: 'StudentDocument',
  AuditLog: 'AuditLog',
  Website: 'Website',
  Qualification: 'Qualification',
  Country: 'Country',
  Application: 'Application',
  ApplicationChecklist: 'ApplicationChecklist',
  AcademicDetail: 'AcademicDetail',
  WorkExperience: 'WorkExperience'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
