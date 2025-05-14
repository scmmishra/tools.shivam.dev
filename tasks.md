# DNS Validation Tasks

## Core Record Validations

### SOA Records
- [ ] Validate serial number format and increment pattern
- [ ] Validate minimum TTL values
- [ ] Verify primary nameserver matches one of NS records
- [ ] Check email address format in RNAME field

### CNAME Records
- [ ] Prevent CNAME at apex/root domain
- [ ] Detect and warn about CNAME coexistence with other records

### CAA Records
- [ ] Validate tag format (issue, issuewild, iodef)
- [ ] Check for known CA domain names
- [ ] Validate iodef reporting configuration
- [ ] Check for complete CA coverage

### MX Records
- [✓] Validate unique priorities
- [ ] Check for null MX implementation (RFC 7505)
- [ ] Warn about deprecated or insecure configurations

## Email Security Validations

### SPF Records (TXT)
- [ ] Detect multiple SPF records
- [ ] Validate complete SPF syntax
- [ ] Check for common provider includes (O365, Google, etc)
- [ ] Validate IP ranges and mechanisms

### DMARC Records (TXT)
- [ ] Basic Record Structure
  - [ ] Validate record exists at _dmarc subdomain
  - [ ] Check v= tag is present and equals "DMARC1"
  - [ ] Validate required p= tag exists
  - [ ] Ensure no duplicate DMARC records exist

- [ ] Policy Validation
  - [ ] Validate p= values (none, quarantine, reject)
  - [ ] Check sp= values match p= values or are valid alternatives
  - [ ] Validate pct= is between 0-100
  - [ ] Alert if no policy is specified

- [ ] Alignment Configuration
  - [ ] Validate aspf= values (r, s)
  - [ ] Validate adkim= values (r, s)
  - [ ] Warn about relaxed alignment risks

- [ ] Reporting Configuration
  - [ ] Validate rua= URI format (mailto: or https://)
  - [ ] Validate ruf= URI format (mailto:)
  - [ ] Check multiple URIs are properly separated
  - [ ] Verify max number of URIs (<=2)
  - [ ] Check URI sizes (<256 chars)

- [ ] Advanced Settings
  - [ ] Validate ri= interval (>= 3600 and <= 86400)
  - [ ] Check fo= contains valid options (0,1,d,s)
  - [ ] Validate rf= feedback type (afrf, iodef)
  - [ ] Check DMARC record total length (<2048)

- [ ] Best Practices
  - [ ] Recommend ruf= for forensic reports
  - [ ] Suggest redundant aggregate report collectors
  - [ ] Warn about missing essential tags
  - [ ] Check policy strength progression
  - [ ] Alert on misconfigured organizational domains

### PTR Records
- [ ] Validate PTR record format

## Service Records

### SRV Records
- [ ] Validate service/protocol combinations
- [ ] Check priority and weight values
- [ ] Validate port numbers against standard services
- [ ] Check record format compliance

## Security Best Practices

### DNSSEC

### General Security
- [ ] Validate NS record distribution
- [ ] Check for deprecated or insecure record types

## TTL Management

### TTL Validations
- [ ] Check TTL consistency across record types
- [ ] Warn about extremely low/high TTLs
- [ ] Validate different TTL strategies per record type
- [ ] Check for misconfigured TTL values
- [ ] Suggest optimal TTL values based on record type

## Implementation Notes

### Priority Levels
- **Critical**: Security-related validations (SPF, DMARC, CAA)
- **High**: Core functionality (MX, A, AAAA, CNAME)
- **Medium**: Best practices and optimization
- **Low**: Nice-to-have features

### Future Enhancements
- Dynamic validation based on domain type
- Custom validation rules
- Bulk domain checking
- Historical record tracking
- Change detection and alerting

## Progress Tracking
✓ = Implemented
⚠️ = Partially Implemented
❌ = Not Started

Current Progress: 1/50 validations implemented

## Validation Implementation Guide

### Implementing a New Validator

Each DNS record validator should follow this structure:

1. **Type Definition**
   ```typescript
   interface RecordData {
     // Parsed fields from the record
     field1: string;
     field2: number;
     // etc...
   }
   ```

2. **Parser Function**
   ```typescript
   function parseRecord(data: string): RecordData | null {
     // Parse raw DNS record data into structured format
     // Return null if parsing fails
   }
   ```

3. **Individual Validators**
   ```typescript
   export const validateSomething: ValidatorFunction = (
     record: DnsRecord,
     context: DnsValidationContext
   ) => {
     const data = parseRecord(record.data);
     if (!data) {
       return utils.formatWarning(
         VALIDATION_MESSAGES.TYPE.INVALID_FORMAT,
         SEVERITY.ERROR
       );
     }
     // Validation logic
     if (someError) {
       return utils.formatWarning(
         VALIDATION_MESSAGES.TYPE.SPECIFIC_ERROR,
         SEVERITY.ERROR
       );
     }
   };
   ```

4. **Main Validator**
   ```typescript
   export function validateRecords(
     records: DnsRecord[],
     context: DnsValidationContext
   ): ValidationResult {
     const results = records.map(record => validateRecord(record, context));
     return {
       isValid: results.every(r => r.isValid),
       warnings: results.flatMap(r => r.warnings),
       errors: results.flatMap(r => r.errors)
     };
   }
   ```

### Required Components

1. **Constants**
   - Add validation messages to `VALIDATION_MESSAGES`
   - Use semantic message keys (e.g., `INVALID_FORMAT`, `DUPLICATE_PRIORITY`)
   - Categorize by record type

2. **Types**
   - Define interfaces for parsed record data
   - Use strong typing for all functions
   - Ensure validators follow `ValidatorFunction` type

3. **Validation Rules**
   - Each validator should focus on one specific aspect
   - Return `ValidationWarning | undefined`
   - Use appropriate severity levels
   - Include relevant metadata when useful

4. **Error Handling**
   - Always validate parsed data
   - Use consistent error messages from constants
   - Include context in validation warnings when helpful

### Example (MX Records)

```typescript
// Parse record
interface MXData {
  priority: number;
  target: string;
}

// Individual validator
export const validatePriorities: ValidatorFunction = (record, context) => {
  const mxData = parseMXRecord(record.data);
  if (!mxData) {
    return utils.formatWarning(
      VALIDATION_MESSAGES.MX.INVALID_FORMAT,
      SEVERITY.ERROR
    );
  }
  // ... validation logic
};

// Main validator
export function validateMXRecords(
  records: DnsRecord[],
  context: DnsValidationContext
): ValidationResult {
  const results = records.map(record => validateMXRecord(record, context));
  return {
    isValid: results.every(r => r.isValid),
    warnings: results.flatMap(r => r.warnings),
    errors: results.flatMap(r => r.errors)
  };
}
```

### Best Practices

1. **Modularity**
   - One validator per validation rule
   - Share parsing logic between validators
   - Keep validation logic focused and testable

2. **Error Messages**
   - Clear, actionable messages
   - Include relevant context
   - Use consistent terminology

3. **Performance**
   - Cache parsed record data when possible
   - Avoid redundant validations
   - Use efficient data structures (Sets, Maps)

4. **Maintainability**
   - Document complex validation rules
   - Include RFC references where applicable
   - Group related validators together
