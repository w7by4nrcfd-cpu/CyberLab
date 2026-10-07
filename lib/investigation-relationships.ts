import type {RelationshipType} from './investigation-board';
export const relationshipTypes:RelationshipType[]=['USES','LOGGED_IN_TO','CONNECTED_TO','SPAWNED','SENT','RECEIVED','OBSERVED_IN','RELATED_TO'];
export const relationshipLabels:Record<RelationshipType,string>={USES:'يستخدم',LOGGED_IN_TO:'سجّل الدخول إلى',CONNECTED_TO:'اتصل بـ',SPAWNED:'أنشأ عملية',SENT:'أرسل',RECEIVED:'استقبل',OBSERVED_IN:'ظهر في',RELATED_TO:'مرتبط بـ'};
