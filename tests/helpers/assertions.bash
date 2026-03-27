# JSON assertion helpers for BATS tests

# Assert that output is valid JSON
assert_valid_json() {
  echo "$output" | python3 -c "import json, sys; json.load(sys.stdin)" 2>/dev/null
  if [[ $? -ne 0 ]]; then
    echo "Expected valid JSON, got: $output" >&2
    return 1
  fi
}

# Assert JSON field value
# Usage: assert_json_field ".stopReason" "expected substring"
assert_json_contains() {
  local field="$1"
  local expected="$2"
  local value
  value=$(echo "$output" | python3 -c "import json, sys; data=json.load(sys.stdin); print(data$(echo "$field" | sed "s/\./']['/g" | sed "s/^/['/;s/$/']/" ))" 2>/dev/null)
  if [[ "$value" != *"$expected"* ]]; then
    echo "Expected field $field to contain '$expected', got: '$value'" >&2
    return 1
  fi
}

# Assert output contains a string
assert_output_contains() {
  local expected="$1"
  if [[ "$output" != *"$expected"* ]]; then
    echo "Expected output to contain '$expected'" >&2
    echo "Got: $output" >&2
    return 1
  fi
}

# Assert output is empty
assert_output_empty() {
  if [[ -n "$output" ]]; then
    echo "Expected empty output, got: $output" >&2
    return 1
  fi
}

# Assert a JSON file has a specific field value
# Usage: assert_file_json "/path/to/file.json" "field.nested" "expected"
assert_file_json() {
  local file="$1"
  local field="$2"
  local expected="$3"
  local value
  value=$(python3 -c "
import json
with open('$file') as f:
    data = json.load(f)
keys = '$field'.strip('.').split('.')
for k in keys:
    if isinstance(data, dict):
        data = data[k]
    else:
        data = str(data)
        break
print(data)
" 2>/dev/null)
  if [[ "$value" != *"$expected"* ]]; then
    echo "Expected $file $field to contain '$expected', got: '$value'" >&2
    return 1
  fi
}
